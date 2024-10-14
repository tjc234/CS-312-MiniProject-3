import express from 'express';
import bodyParser from 'body-parser';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import session from 'express-session';

// initialize global variables
const { Pool } = pkg;
const app = express();
const port = 3000;

// database connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'BlogDB',
    password: 'Ilovecoffee',
    port: 5432
});

// parse incoming requests and serve static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// set the view engine to EJS
app.set('view engine', 'ejs'); 

// setup session for login
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

// redirect to signin page
app.get('/login', (req, res) => {
    // redirect to signin page
    res.redirect('/signin');
});

// check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        // redirect to login page if user is not logged in
        return res.redirect('/login');
    } 
    next();
}

// routing for homepage (GET)
app.get("/", requireLogin, async (req, res) => {
    try {
        // fetch posts from the database and order by date created
        const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
        const posts = result.rows;

        // render index page with posts object and user session
        res.render('index', { posts: posts, user: req.session.user });

    // catch any errors
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).send('Server error');
    }
});

// create a new post (POST)
app.post("/", requireLogin, async (req, res) => {
    const { title, content } = req.body;
    const user = req.session.user;

    // start creating post
    try {
        // insert new post into the database
        await pool.query(
            'INSERT INTO blogs (title, body, creator_user_id, date_created) VALUES ($1, $2, $3, NOW())',
            [title, content, user.user_id]
        );
        res.redirect('/');

    // catch any errors
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).send('Server error');
    }
});

// post deletion (POST)
app.post("/delete", requireLogin, async (req, res) => {
    const blog_id = req.body.blog_id;
    const user = req.session.user;

    // start deleting post
    try {
        // only delete post if the current user created it
        await pool.query('DELETE FROM blogs WHERE blog_id = $1 AND creator_user_id = $2', [blog_id, user.user_id]);
        res.redirect('/');

    // catch any errors
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).send('Internal server error');
    }
});

// post editing (POST)
app.post("/edit", requireLogin, async (req, res) => {
    const { blog_id, title, content } = req.body;
    const user = req.session.user;

    // start editing post
    try {
        // only update post if the current user created it
        await pool.query(
            'UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3 AND creator_user_id = $4',
            [title, content, blog_id, user.user_id]
        );
        res.redirect('/');

    // catch any errors
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).send('Internal server error');
    }
});

// signup (GET)
app.get("/signup", (req, res) => {
    res.render('signup');
});

// sign up (POST)
app.post("/signup", async (req, res) => {
    const { username, password, name } = req.body;

    // start creating user
    try {
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // insert new user into the database
        await pool.query(
            'INSERT INTO users (username, password, name) VALUES ($1, $2, $3)',
            [username, hashedPassword, name]
        );
        res.redirect('/signin');

    // catch any errors    
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).send('Internal server error');
    }
});

// sign in (GET)
app.get("/signin", (req, res) => {
    res.render('signin');
});

// sign in (POST)
app.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    // start signing in
    try {
        // find user by username
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        // if username and password are valid
        if (user && await bcrypt.compare(password, user.password)) {
            // store user info in session after successful login
            req.session.user = user;
            res.redirect('/');
        
        // if username or password is invalid
        } else {
            res.status(400).send('Invalid username or password');
        }
    } catch (err) {
        console.error('Error during sign-in:', err);
        res.status(500).send('Internal server error');
    }
});

// log out (GET)
app.get("/logout", (req, res) => {
    // destroy session and redirect to signin page
    req.session.destroy(() => {
        res.redirect('/signin');
    });
});

// start the server (LISTEN)
app.listen(port, () => {
    // log message to the console to confirm server start
    console.log(`Server running on port ${port}.`);
});

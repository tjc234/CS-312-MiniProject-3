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
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

// set the view engine to ejs
app.set('view engine', 'ejs'); 

// setup session for login
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

// check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    } 
    next();
}

// routing for homepage (get)
app.get("/", requireLogin, async (req, res) => {
    try {
        // fetch posts from the database
        const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
        const posts = result.rows;

        // render index.ejs
        res.render('index', { posts: posts, user: req.session.user });
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).send('Internal server error');
    }
});

app.post("/", requireLogin, async (req, res) => {
    const { title, content } = req.body;
    const user = req.session.user;

    try {
        // insert new post into the database
        await pool.query(
            'INSERT INTO blogs (title, body, creator_user_id, name, date_created) VALUES ($1, $2, $3, $4, NOW())',
            [title, content, user.user_id, user.name]
        );
        res.redirect('/');
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).send('Internal server error');
    }
});


// post deletion (post)
app.post("/delete", requireLogin, async (req, res) => {
    const blog_id = req.body.blog_id;
    const user = req.session.user;

    try {
        // only delete post if the current user created it
        await pool.query('DELETE FROM blogs WHERE blog_id = $1 AND creator_user_id = $2', [blog_id, user.user_id]);
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).send('Internal server error');
    }
});

// post editing (post)
app.post("/edit", requireLogin, async (req, res) => {
    const { blog_id, title, content } = req.body;
    const user = req.session.user;

    try {
        // only update post if the current user created it
        await pool.query(
            'UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3 AND creator_user_id = $4',
            [title, content, blog_id, user.user_id]
        );
        res.redirect('/');
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).send('Internal server error');
    }
});

// singup (get)
app.get("/signup", (req, res) => {
    res.render('signup');
});

//sign up (post)
app.post("/signup", async (req, res) => {
    const { username, password, name } = req.body;

    try {
        // hash the password and store user info
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, password, name) VALUES ($1, $2, $3)',
            [username, hashedPassword, name]
        );
        res.redirect('/signin');
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).send('Internal server error');
    }
});

// sign in (get)
app.get("/signin", (req, res) => {
    res.render('signin');
});

// sign in (post)
app.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    try {
        // find user by username
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            // store user info in session after successful login
            req.session.user = user;
            res.redirect('/');
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
    req.session.destroy(() => {
        res.redirect('/signin');
    });
});

// start the server (listen)
app.listen(port, () => {
    // log message to the console to confirm server start
    console.log(`Server running on port ${port}.`);

}); 
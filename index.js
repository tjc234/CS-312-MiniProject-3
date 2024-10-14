import express from 'express';
import bodyParser from 'body-parser';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import session from 'express-session';

// initialize global variables
const { Client } = pkg;
const app = express();
const port = 3000;

// database connection
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'BlogDB',
    password: 'Ilovecoffee',
    port: 5432
});

// connect to the database
client.connect()
    .then(() => console.log('Connected to the database'))
    .catch(err => console.error('Connection error', err.stack));

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
    res.redirect('/signin');
});

// check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        // if not logged in redirect to login page
        return res.redirect('/login');
    } 

    // if logged in proceed to the next middleware
    next();
}

// routing for homepage (GET)
app.get("/", requireLogin, async (req, res) => {
    // fetch all posts from the database
    try {
        const result = await client.query(`
            SELECT blogs.*, users.username, users.name 
            FROM blogs 
            JOIN users ON blogs.creator_user_id = users.user_id 
            ORDER BY date_created DESC
        `);
        // store the posts in an object
        const posts = result.rows;

        // render the index page with posts
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

    // insert the new post into the database
    try {
        await client.query(
            'INSERT INTO blogs (title, body, creator_user_id, date_created) VALUES ($1, $2, $3, NOW())',
            [title, content, user.user_id]
        );
        // redirect to the homepage
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

    // delete the post from the database
    try {
        await client.query('DELETE FROM blogs WHERE blog_id = $1 AND creator_user_id = $2', [blog_id, user.user_id]);
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

    // update the post in the database
    try {
        await client.query(
            'UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3 AND creator_user_id = $4',
            [title, content, blog_id, user.user_id]
        );
        // redirect to the homepage
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

    // hash the password and insert the new user into the database
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await client.query(
            'INSERT INTO users (username, password, name) VALUES ($1, $2, $3)',
            [username, hashedPassword, name]
        );

        // redirect to the sign-in page
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

    // check if the user exists and the password is correct
    try {
        const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = user;

            // redirect to the homepage
            res.redirect('/');

        // if the user does not exist or the password is incorrect
        } else {
            // redirect to the signin page
            res.status(400).send('Invalid username or password');
        }

    // catch any errors
    } catch (err) {
        console.error('Error during sign-in:', err);
        res.status(500).send('Internal server error');
    }
});

// log out (GET)
app.get("/logout", (req, res) => {
    // destroy the session and redirect to the signin page
    req.session.destroy(() => {
        res.redirect('/signin');
    });
});

// start the server (LISTEN)
app.listen(port, () => {
    // log the port the server is running on
    console.log(`Server running on port ${port}.`);
});

// close the client on exit
process.on('exit', () => {
    // close the database connection
    client.end(() => {
        console.log('Database connection closed');
    });
});

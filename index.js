import express from 'express';
import bodyParser from 'body-parser';

// initialize global variables
const app = express();
const port = 3000;
let posts = []; // array to hold posts
let postToEdit = null; // variable to hold current post being editted

// parse incoming requests and serve static files
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

// set the view engine to ejs
app.set('view engine', 'ejs'); 

// routing for homepage (get)
app.get("/", (req, res) => {
    // render index.ejs with posts array and post to edit
    res.render('index', {posts: posts, postToEdit: postToEdit});

    // reset post to edit to null after rendering
    postToEdit = null;
});

// form submission (post) 
app.post("/", (req, res) => { 
    // get the form data
    const { author, title, content, originalTitle } = req.body;

    // if the original title is not null post is being edited
    if ( originalTitle ) {
        // find the index of the post in the array
        const index = posts.findIndex(post => post.title === originalTitle); 

        // if the post is found negative one is returned
        if (index !== -1) {
            // update the post in the array with the form data
            posts[index] = {
                author: author,
                title: title,  
                content: content, 
                timestamp: new Date().toTimeString()
            };
        }
    // if original title valuse is null post is new
    } else {
        // create a new post object with the form data 
        const post = { 
            author: req.body.author,
            title: req.body.title,
            content: req.body.content,
            timestamp: new Date().toTimeString()
        };

        // add the post to the array
        posts.push(post); 
    }

    // redirect to homepage
    res.redirect('/'); 

});

// post deletion (post)
app.post("/delete", (req, res) => {
    // get the title of the post to delete
    const title = req.body.title;

    // filter out the post to delete
    posts = posts.filter(post => post.title !== title);

    // redirect to homepage
    res.redirect('/');

});

// post editing (post)
app.post("/edit", (req, res) => {
    // get the title of the post to edit
    const title = req.body.title;

    // find the post in the array and set it to postToEdit
    postToEdit = posts.find(post => post.title === title);

    // redirect to homepage
    res.redirect('/');

});

// start the server (listen)
app.listen(port, () => {
    // log message to the console to confirm server start
    console.log(`Server running on port ${port}.`);

}); 
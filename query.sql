-- create users table
CREATE TABLE users (
	user_id SERIAL PRIMARY KEY,
	username VARCHAR(50) UNIQUE NOT NULL,
	password VARCHAR(255) NOT NULL,
	name VARCHAR(255) NOT NULL
);

-- create blogs table
CREATE TABLE blogs (
	blog_id SERIAL PRIMARY KEY,
	creator_user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
	title VARCHAR(255) NOT NULL,
	body TEXT NOT NULL,
	date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- insert users
INSERT INTO users (username, password, name) VALUES
	('harrypotter123', 'theboywholived', 'Harry Potter'),
	('spiderman', 'maryjane', 'Peter Parker'),
	('greenday', 'dookie', 'Billy Joe Armstrong');

-- insert blogs
INSERT INTO blogs (creator_user_id, title, body) VALUES
    (1, 'The Philosophers Stone', 'This is the first book in the Harry Potter series. Where it all began, the return of the dark lord.'),
    (1, 'The Chamber of Secrets', 'My second year at Hogwarts was even more eventful than the first! I think I might attract trouble...'),
    (2, 'The Amazing Spiderman', 'When I was bitten by a spider I gained superpowers. I use them to fight crime and protect the people of New York.'),
    (2, 'Spiderman 2', 'I first befriend Dr. Otto Octavius, but he becomes the villain Doctor Octopus. I must stop him from destroying the city.'),
    (3, 'Dookie', 'Released in 1994, this album made us start picking up steam in the music industry.'),
    (3, 'American Idiot', 'This is the seventh album by us, released in 2004. It was a massive success and was about the current political climate.');

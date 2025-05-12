import express from 'express';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import morgan from 'morgan';
import methodOverride from 'method-override';

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// App setup
const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/event-booking')  // Corrected MongoDB connection
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Event model
const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  time: String,
  venue: String,
  image: String,
  totalSeats: Number,
  bookedSeats: [String]
});
const Event = mongoose.model('Event', eventSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Views setup
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Routes

// Homepage
app.get('/', async (req, res) => {
  const events = await Event.find().limit(3);
  res.render('index', { events });
});

// List all events
app.get('/events', async (req, res) => {
  const events = await Event.find();
  res.render('events/index', { events });
});

// New event form
app.get('/events/new', (req, res) => {
  res.render('events/new');
});

// Create event
app.post('/events', async (req, res) => {
  const newEvent = new Event({
    ...req.body,
    image: req.body.image || 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg',
    totalSeats: parseInt(req.body.totalSeats),
    bookedSeats: []
  });
  await newEvent.save();
  res.redirect('/events');
});

// Show event
app.get('/events/:id', async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.redirect('/events');
  res.render('events/show', { event });
});

// Edit event form
app.get('/events/:id/edit', async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.redirect('/events');
  res.render('events/edit', { event });
});

// Update event
app.put('/events/:id', async (req, res) => {
  await Event.findByIdAndUpdate(req.params.id, {
    ...req.body,
    totalSeats: parseInt(req.body.totalSeats)
  });
  res.redirect(`/events/${req.params.id}`);
});

// Delete event
app.delete('/events/:id', async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.redirect('/events');
});

// Seat booking page
app.get('/events/:id/book', async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.redirect('/events');
  res.render('events/book', { event });
});

// Process seat booking
app.post('/events/:id/book', async (req, res) => {
  const event = await Event.findById(req.params.id);
  const selectedSeats = Array.isArray(req.body.seats) ? req.body.seats : [req.body.seats];
  event.bookedSeats = [...new Set([...event.bookedSeats, ...selectedSeats])];
  await event.save();
  res.redirect(`/events/${req.params.id}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

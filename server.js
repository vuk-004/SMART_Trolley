const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/router');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.json());
app.use('/api',userRoutes);


app.post('/data', (req, res) => {
  console.log('Received data:', req.body);
  res.send('Data received');
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
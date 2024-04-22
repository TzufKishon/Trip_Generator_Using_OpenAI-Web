require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const extract  = require('extract-json-from-string')

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    next();
});

const generateImage = async (name) => {
    try {
        console.log('Generating image for:', name);
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            prompt: `Generate a beautiful image of ${name}`,
            model: 'dall-e-2',
            n: 1,
            size: '256x256'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Image generated:', response.data.data[0].url);
        return response.data.data[0].url;
    } catch (error) {
        console.error('Failed to generate image:', error);
    }
}

// Function to generate trip information using OpenAI's API
const generateTripInformation = async (country, mode) => {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                { role: 'system', content: "You are a helpful assistant." },
                { role: 'user', content: `Generate 3 trip routes for ${country} by ${mode} (make short length trips), including the name and starting and ending coordinates (like this: latitude, longitude, start, end, name) of each trip in JSON format only, do not use array.` }
            ],
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Assuming the JSON data is wrapped within a clear pattern or markers
        const jsonData = response.data.choices[0].message.content;
        const jsonStart = jsonData.indexOf('{');
        const jsonEnd = jsonData.lastIndexOf('}') + 1;
        const cleanJsonData = jsonData.substring(jsonStart, jsonEnd);

        try {
            console.log(jsonData);
            // const trips = JSON.parse(jsonData);
            js = extract(jsonData)
            console.log("sssss" + JSON.stringify(js))
            return js;
        } catch (parseError) {
            console.error('Error parsing JSON data:', parseError);
            throw new Error('Failed to parse trip data as JSON.');
        }
        
    } catch (error) {
        console.error('Error generating trip information:', error);
        throw error;
    }
};


app.post('/generate', async (req, res) => {
    const { country, mode } = req.body;
    try {
        const trips = await generateTripInformation(country, mode);
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(trips);
    } catch (error) {
        console.error('Error at /generate endpoint:', error);
        res.status(500).json({ error: 'Failed to generate trip information' });
    }
});
app.post('/image', async (req, res) => {
    const { name } = req.body;
    try {
        const image = await generateImage(name);
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(image);
    } catch (error) {
        console.error('Error at /generate endpoint:', error);
        res.status(500).json({ error: 'Failed to generate trip information' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});




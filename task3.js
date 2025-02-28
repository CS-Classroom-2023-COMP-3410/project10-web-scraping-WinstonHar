const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://www.du.edu/calendar";
const OUTPUT_FILE = path.join(__dirname, "results", "calendar_events.json");

// Function to fetch HTML content from a URL
async function fetchHTML(url) {
    try {
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

// Function to scrape event details from an individual event page
async function scrapeEventPage(eventUrl) {
    const html = await fetchHTML(eventUrl);
    if (!html) return null;

    const $ = cheerio.load(html);
    const description = $(".event-description").text().trim() || null;
    return description;
}

// Main function to scrape the DU calendar
async function scrapeDUCalendar() {
    console.log("Scraping DU calendar events...");

    // Define the date range for the events
    const startDate = "2025-01-01";
    const endDate = "2025-12-31";

    // Construct the URL with date filters
    const urlWithDates = `${BASE_URL}?start_date=${startDate}&end_date=${endDate}`;

    // Fetch the HTML content of the filtered events page
    const html = await fetchHTML(urlWithDates);
    if (!html) return;

    const $ = cheerio.load(html);
    const events = [];

    // Iterate over each event item on the page
    $(".events-listing__item a.event-card").each((index, element) => {
        const eventTitle = $(element).find("h3").text().trim();
        const eventDate = $(element).find("p").first().text().trim();
        const eventTimeMatch = $(element).find(".icon-du-clock").parent().text().trim();
        const eventTime = eventTimeMatch || null;
        const eventUrl = $(element).attr("href");

        // Construct the full URL for the event
        const fullEventUrl = new URL(eventUrl, BASE_URL).href;

        // Add the event details to the events array
        events.push({
            title: eventTitle,
            date: eventDate,
            time: eventTime ? eventTime : undefined,
            url: fullEventUrl,
        });
    });

    console.log(events);
    console.log(`Found ${events.length} events. Fetching descriptions...`);

    // Fetch descriptions for each event asynchronously
    for (let i = 0; i < events.length; i++) {
        const eventDescription = await scrapeEventPage(events[i].url);
        if (eventDescription) events[i].description = eventDescription;
    }

    console.log(`Successfully extracted ${events.length} events.`);

    // Save the events data to a JSON file
    fs.outputJson(OUTPUT_FILE, { events }, { spaces: 2 })
        .then(() => console.log(`Data saved to ${OUTPUT_FILE}`))
        .catch((err) => console.error("Error saving data:", err));
}

// Run the scraper
scrapeDUCalendar();

const axios = require("axios");
const Day = require("./Day");

const FUTURE_DAYS = 7;

class Timeline {
	constructor() {
		this.days = [];
	}

	async init(files) {
		this.details = await this.fetchCountryDetails();
		await this.processFiles(files);
		await this.futureDays();
		await this.genGeoJSON();
		// console.log(await this.days[0]);
		return await this.days;
	}

	async fetchCountryDetails() {
		return axios({
			method: "GET",
			url: "https://restcountries-v1.p.rapidapi.com/all",
			headers: {
				"content-type": "application/octet-stream",
				"x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
				"x-rapidapi-key": "42752e8809msh0edf75d88c1b7e7p177e3djsn05d91367a12a"
			}
		})
			.then(async response => {
				return response.data;
			})
			.catch(error => {
				console.log("Couldn't find country details", error);
			});
	}

	async processFiles(files) {
		// Loops through each file, creating a new Day instance and extra data
		// parsing
		files.forEach(async day => {
			await this.processDay(day[0], day[1]);
		});
		return;
	}

	// Process a file representing the coronavirus statistics by country for that
	// day
	processDay(filename, content) {
		let day = new Day();
		// Prevents commas within quotes from messing up the seperation
		content = this.dealsWithQuoteMarks(content);
		// Seperating each lines
		const lines = content.split("\n");
		for (let i = 1; i < lines.length; i++) {
			// Segments each line
			const regionLine = lines[i].split(",", -1);
			// Makes any elements that are blank 0
			for (let index = 1; index < regionLine.length; index++) {
				if (!regionLine[index] || regionLine[index].includes("\r")) {
					regionLine[index] = "0";
				}
			}
			// Prevents an error with undefined fields
			if (typeof regionLine[1] !== "undefined") {
				// Extracts data from the line and adds it to the appropriate day
				this.extractData(day, filename, regionLine);
			}
		}
		this.days.push(day);
		return;
	}

	// Extracts data from the line and adds it to the appropriate day
	extractData(day, filename, regionLine) {
		// Extracts cases from the region line
		const cases = regionLine[3].trim();
		// Checks if the entry is blank
		if (cases <= 0) {
			return;
		}

		// Extracts more constants from the region line
		const deaths = regionLine[4].trim();
		const recovered = regionLine[5].trim();
		// Changes country names from downloaded files into ones that are used to store countries
		const countryName = this.dictStore(regionLine[1].trim());
		// Calculates formatted date using the downloaded filename
		const date = this.getFormattedDate(filename);
		// Changes country nams from the ones stored to lookup data in the Rest countries API
		const searchName = this.dictRest(countryName);

		try {
			// Looks up other information from country details array
			const countryDetails = this.searchCountryDetails(searchName);
			if (typeof countryDetails === "undefined")
				throw "Error finding country details for: " + searchName;
			const {
				population,
				latlng,
				region: continent,
				altSpellings
			} = countryDetails;

			// Adds data to the day
			let country = day.addData(
				cases,
				deaths,
				recovered,
				countryName,
				date,
				population,
				latlng,
				continent,
				altSpellings
			);

			// Extracts data from yesterdays result
			let varsArray = [0, 0, 0, 0];
			let yesterday;
			let index = -1;
			if (this.days.length !== 0) {
				yesterday = this.days[this.days.length - 1];
				index = yesterday.searchForCountry(
					countryName
				);
			}
			if (index !== -1) {
				let countryYesterday = yesterday.countries[index];
				varsArray = countryYesterday.getVarsArray();
			}
			// Compares data from this day and the previous to calculate increases
			country.comparison(varsArray);
		} catch (error) {
			// console.log('General Error for: ' + searchName);
			console.error(error);
		}
	}

	// Prevents commas within quotes in a csv file from messing up the seperation
	dealsWithQuoteMarks(content) {
		let inQuote = false;
		for (let index = 0; index < content.length; index++) {
			let element = content.charAt(index);
			if (inQuote && element === ",") {
				// Deletes element
				content =
					content.slice(0, index - 1) + content.slice(index, content.length);
			} else if (element === '"') {
				// Deletes element
				content =
					content.slice(0, index - 1) + content.slice(index, content.length);
				if (inQuote) {
					inQuote = false;
				} else {
					inQuote = true;
				}
			}
		}
		return content;
	}

	// // Checks if a country is present in a previous day but not the current day
	// // And adds it to the current day if not
	// async checkConcurrency(day, previousDay) {
	// 	previousDay.countries.forEach(async function(country) {
	// 		if (day.searchForCountry(country.name) === -1) {
	// 			day.addData(
	// 				country.cases,
	// 				country.deaths,
	// 				country.recovered,
	// 				country.name,
	// 				false
	// 			);
	// 		}
	// 	});
	// }

	// Looks up information about a country from the country details array
	searchCountryDetails(name) {
		return this.details.filter(country => {
			if (country.name === name) return true;
			return country.altSpellings.includes(name);
		})[0];
	}

	// Gets the highest value of a property in the days array
	getMax(type) {
		let max = 0;
		this.currentDay.forEach(feature => {
			if (feature.properties[type] > max) {
				max = feature.properties[type];
			}
		});
		return max;
	}

	// Gets geojson data for a particular day
	async retrieveDay(index) {
		return await this.days[index].geojson;
	}

	// Generates geojson data for all days
	async genGeoJSON() {
		this.days.forEach(day => {
			day.parseGeoJSON();
		});
	}

	// Calculates formatted date using the downloaded filename
	getFormattedDate(downloadDate) {
		// Removes extension if necessary
		if (downloadDate.endsWith(".csv")) {
			downloadDate.replace(".csv", "");
		}
		// Parses all date sections
		const sections = downloadDate.split("-");
		const day = sections[1];
		const month = sections[0];
		const year = sections[2];
		const dateVar = day + "/" + month + "/" + year;
		return dateVar;
	}

	// Returns the date formatted as used in the url for files
	getStorageDate(date) {
		const day = ("0" + date.getDate()).slice(-2);
		const month = ("0" + (date.getMonth() + 1)).slice(-2);
		const year = date.getFullYear();
		const dateVar = day + "/" + month + "/" + year;
		return dateVar;
	}

	// Creates the days in the future that are predictions
	futureDays() {
		// Helps generate the formatted date
		let today = new Date();
		today.setHours(0, 0, 0, 0);

		// Adds each day in the future
		for (let c = 0; c < FUTURE_DAYS; c++) {
			let lastDay = this.days[this.days.length - 1];
			let futureDay = new Day();
			futureDay.isEstimation = true;
			lastDay.countries.forEach(country => {
				const {
					cases,
					deaths,
					recovered,
					name,
					population,
					coordinates,
					continent
				} = country;
				const date = this.getStorageDate(today);
				const increases = this.calculateIncrease();
				// console.log(increases);
				futureDay.addData(
					cases * 1.33,
					deaths * 1.33,
					recovered * 1.33,
					name,
					date,
					population,
					[coordinates[1], coordinates[0]],
					continent
				);
			});

			this.days.push(futureDay);
			today.setDate(today.getDate() + 1);
		}
	}

	calculateIncrease() {
		const ESTIMATED_INCREASE_DAYS = 7;
		// Stores total increases in x
		let tiActive = 0;
		let tiCases = 0;
		let tiDeaths = 0;
		let tiRecovered = 0;
		for (
			let i = this.days.length - ESTIMATED_INCREASE_DAYS;
			i < this.days.length;
			i++
		) {
			const day = this.days[i];
			tiActive += day.active;
			tiCases += day.cases;
			tiDeaths += day.deaths;
			tiRecovered += day.recovered;
		}
		return [parseInt(tiActive), tiCases, tiDeaths, tiRecovered];
	}

	// Changes country names from downloaded files into ones that are used to store countries
	dictStore(countryName) {
		switch (countryName) {
			case "Mainland China":
				return "China";
			case "US":
				return "United States";
			case "UK":
				return "United Kingdom";
			case "Saint Barthelemy":
				return "France";
			case "occupied Palestinian territory":
			case "Palestine":
				return "Palestinian Territories";
			case "North Macedonia":
				return "Macedonia [FYROM]";
			case "Iran (Islamic Republic of)":
				return "Iran";
			case "Hong Kong SAR":
				return "Hong Kong";
			case "Viet Nam":
				return "Vietnam";
			case "Macao SAR":
				return "Macau";
			case "Russian Federation":
				return "Russia";
			case "Ivory Coast":
			case "Cote d'Ivoire":
				return "Côte dIvoire";
			case "Taiwan*":
				return "Taiwan";
			case "North Ireland":
				return "United Kingdom";
			case "Republic of Ireland":
				return "Ireland";
			case "Holy See":
				return "Vatican City";
			case "Czechia":
				return "Czech Republic";
			case "Reunion":
				return "France";
			case "Republic of Korea":
			case 'Sout"':
				return "South Korea";
			case "St. Martin":
			case "Saint Martin":
				return "France";
			case "Republic of Moldova":
				return "Moldova";
			case "Taipei and environs":
				return "Taiwan";
			case "Channel Islands":
				return "United Kingdom";
			case "Congo (Kinshasa)":
				return "Congo [DRC]";
			case 'Th"':
				return "The Gambia";
			case "Cruise Ship":
			case "Others":
				return "Japan";
			default:
				return countryName;
		}
	}

	// Changes country names from the ones stored to lookup data in the Rest countries API
	dictRest(name) {
		switch (name) {
			case "Ireland":
				return "IE";
			case "Macedonia [FYROM]":
				return "MK";
			case "Vatican City":
				return "Vatican";
			case "Eswatini":
				return "SZ";
			case "Côte dIvoire":
				return "Ivory Coast";
			case "Congo [DRC]":
				return "DRC";
			case "Congo (Brazzaville)":
				return "Congo-Brazzaville";
			case "Kosovo":
				return "Republic of Kosovo";
			case "Palestinian Territories":
				return "Palestine";
			case "Cabo Verde":
				return "Cape Verde";
			case "Timor-Leste":
				return "East Timor";
			default:
				return name;
		}
	}
}

module.exports = Timeline;

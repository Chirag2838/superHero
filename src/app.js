const express = require('express');
const request = require('request');
const app = express();

const port = 3000;

app.use(express.json());

const HerosData = function (length, onDone, allDone) {
    this.onDone = onDone;
    this.allDone = allDone;
    this.length = length;
    this.herosFetched = 0;
    this.resObj1 = {};
    this.resObj2 = {};
    this.data = [];
    this.finRes = (resp) => {
        delete resp.power;
        this.data.push(resp);
        if(this.data.length === 2) {
            this.allDone();
        }
    }
    this.add = function (hero) {
        const temp = {name : hero.name, placeOfBirth: hero.biography.placeOfBirth, power: hero.powerstats.power};
        if(Object.keys(this.resObj1).length === 0) {
            this.resObj1 = temp;
        } else if (Object.keys(this.resObj2).length === 0) {
            if(this.resObj1.power > hero.powerstats.power) {
                this.resObj2 = temp;
            } else {
                this.resObj2 = this.resObj1;
                this.resObj1 = temp;
            }
        } else {
            if (this.resObj2.power < hero.powerstats.power) {
                if (this.resObj1.power < hero.powerstats.power) {
                    this.resObj1 = temp;
                    this.resObj2 = this.resObj1;
                } else {
                    this.resObj2 = temp;
                }
            }
        }
        this.herosFetched++;
        if(this.herosFetched === this.length) {
            this.resObj1.rank = 1;
            this.resObj2.rank = 2;
            this.onDone();
        }
    }
}

app.post('/superHero', async(req, res) => {

    let power = 0;
    const reqHeros = req.body.heros || [];
    const heroData = new HerosData(reqHeros.length, function () {
        getWeather(this.resObj1, this.finRes);
        getWeather(this.resObj2, this.finRes);

    }, function () {
        res.send(this.data);
    });
    const options = {
        method: 'GET',
        url: 'https://superhero-search.p.rapidapi.com/',
        qs: {hero: 'spiderman'},
        headers: {
          'x-rapidapi-host': 'superhero-search.p.rapidapi.com',
          'x-rapidapi-key': '636fe699f4msh469a1ef7eac2a2ep1e256cjsnf5ac62ba7fdc',
          useQueryString: true
        }
    }
    let i = 0;
    for(let j=0; j<reqHeros.length; j++) {
        const element = reqHeros[j];
        options['qs'] = {hero: element};
        (function(options, heroData) {
            setTimeout(() => {
                getSuperHeroData(options, heroData);
            }, i);
        })({...options}, heroData);
        i = i + 2000;
    }
})

const getSuperHeroData = (options, heroData) => {
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
            const op = JSON.parse(body);
            heroData.add(op);
    });
}

const getWeather = (resObj, finRes) => {
    const options = {
        method: 'GET',
        url: 'https://weatherapi-com.p.rapidapi.com/forecast.json',
        qs: {days: '3', q: resObj.placeOfBirth},
        headers: {
          'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com',
          'x-rapidapi-key': 'c097a36f20msh5700d85658a8654p185c07jsncf68219b7271',
          useQueryString: true
        }
      };
      
      request(options, function (error, response, body) {
          if (error) throw new Error(error);
      
          const weatherRes = JSON.parse(body);
          const lat = weatherRes.location.lat;
          const lon = weatherRes.location.lon;
          resObj['currentWeatherCelsius'] = weatherRes.current.temp_c;
          getRestaurant(resObj, lat, lon, finRes);
      });
}

const getRestaurant = (resObj, lat, lon, finRes) => {
    const options = {
        method: 'GET',
        url: 'https://developers.zomato.com/api/v2.1/geocode?lat='+lat+'&lon='+lon,
        headers : {
            'Accept': 'application/json',
            'user-key': 'd6f8ac5e043acf6719e4ffa1adb665ec'
        }
    }

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        const restData = JSON.parse(body);
        if(restData.code === 400) {
            resObj.restaurant = {message: 'No restaurant found'}
            finRes(resObj);
        } else {
            const allRest = restData.nearby_restaurants[0];
            const name = allRest.restaurant.name;
            const ratings = allRest.restaurant.user_rating.aggregate_rating;
            resObj.restaurant = {name, ratings};
            finRes(resObj);
        }
    })
}

app.listen(port, () => {
    console.log('server running on port '+ 3000);
})


//https://developers.zomato.com/api/v2.1/geocode?lat=40.742051&lon=-74.004821






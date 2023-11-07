let button;
let currentSunsets;
let currentSunset;
let currentIndex;
let currentTime;
let sunsetWindow = 40;
let afterWindow = 20;
let numSunsets = 1;

document.addEventListener('DOMContentLoaded', async function() {
    //Get current time
    currentTime = new Date();
    currentTime = currentTime.getUTCHours() * 60 + currentTime.getUTCMinutes();
    button = document.querySelector('#next');
   // Get the sunset time for each location and add it to the object
    for(let i = 0; i < sunsetData.length; i++){
        //Check if sunsettime exists already
        if(sunsetData[i].SunsetTime){
            continue;
        }
        let sunsetTime = await getSunsetTime(sunsetData[i].Latitude, sunsetData[i].Longitude);
        sunsetData[i].SunsetTime = sunsetTime;
    }
    console.log(sunsetData.length);
    for(let i = 0; i < sunsetData.length; i++){
        if(!sunsetData[i].MinuteTime){
        //Add UTC minutes
        let sunsetTime = sunsetData[i].SunsetTime.split(':');
        sunsetTime = parseInt(sunsetTime[0]) * 60 + parseInt(sunsetTime[1]);
        //Check if PM and add 12 hours to it
        if(sunsetData[i].SunsetTime.includes('PM')){
            sunsetTime += 720;
        }
        //Check if first characters of sunset time are 12 and subtract 12 hours from it
        if(sunsetData[i].SunsetTime.substring(0, 2) == '12'){
            sunsetTime -= 720;
        }
        sunsetData[i].MinuteTime = sunsetTime;
    }
    }
    console.log(sunsetData.length)
    //Sort the sunset data by time
    sunsetData.sort(function(a, b){
        return a.MinuteTime - b.MinuteTime;
    });
    console.log(sunsetData);

    //Get sunsets
    currentSunsets = findClosest(sunsetData, sunsetWindow, numSunsets, currentTime);
    currentIndex = 0;
    currentSunset = currentSunsets[currentIndex];
    button.innerText = `Next sunset (${currentIndex + 1}/${currentSunsets.length})`;
    renderStream(currentSunset);
    checkAllTimes();
    updateSite();
});

function renderStream(currentSunset){
    console.log("closest stream ", currentSunset);
    //Display the stream
    //Check if it's a youtube video
    //Log sunset time in UTC
    console.log(currentSunset.SunsetTime);
    let iframe = document.createElement('iframe');
    if(currentSunset.Stream.includes('youtube')){
        //If it is, get the video ID
        let videoID = currentSunset.Stream.split('v=')[1];
        //Create the iframe
        iframe.src = `https://www.youtube.com/embed/${videoID}?&autoplay=1`;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.frameborder = "0";
        //Start playing the video automatically

        iframe.allow = "autoplay, fullscreen";
        iframe.allowfullscreen = "true";
        iframe.allowfullscreen="allowfullscreen"
    }
    else {
        iframe.src = currentSunset.Stream;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.frameborder = "0";
        iframe.allow = "autoplay";
        iframe.allowfullscreen = "true";
    }
    //clear stream div
    document.querySelector('#stream').innerHTML = "";
    //Add iframe to stream div
    document.querySelector('#stream').appendChild(iframe);

    //Add info to info div
    let info = document.querySelector("#info");
    info.innerHTML = "";
    let location = document.createElement('p');
    location.innerHTML = `This is <a target="_BLANK" href="https://www.google.com/maps/search/?api=1&query=${currentSunset.Latitude},${currentSunset.Longitude}"> ${currentSunset.Description}</a>`;
    let sunsetTime = document.createElement('p');
    console.log("sunset time" + currentSunset.MinuteTime)
    console.log("current time" + currentTime);
    let difference = currentSunset.MinuteTime - currentTime;
    if (difference > 720){
        difference = difference - 1440;
    }
    else if(difference < -720){
        difference = difference + 1440;
    }
    sunsetTime.innerText = `It's currently ${Math.abs(difference)} minutes ${difference < 0 ? "after" : "before"} sunset.`;
    info.appendChild(location);
    info.appendChild(sunsetTime);
}

function updateSite(){
    //Get current time
    currentTime = new Date();
    currentTime = currentTime.getUTCHours() * 60 + currentTime.getUTCMinutes();
    console.log("updating site");
    currentSunsets = (currentSunsets = findClosest(sunsetData, sunsetWindow, 1, currentTime));
    //Check if the current sunset is in the list of sunsets
    if(currentSunset){
        //If the current sunset is in the list of sunsets, update the index
        currentIndex = currentSunsets.indexOf(currentSunset);
    } else {
        currentIndex = 0;
        renderStream(currentSunset);
    }
    button.innerText = `Next sunset (${currentIndex + 1}/${currentSunsets.length})`;
    //Update broken form with link to current stream
    document.querySelector('#broken').value = currentSunset.Stream;
    //Run function again in 1 minute
    setTimeout(updateSite, 6000);
}

async function getSunsetTime(latitude, longitude){
    let sunsetTime = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}`)
    .then(response => response.json())
    .then(data => {
        return data.results.sunset;
    })
    return(sunsetTime);
}

function checkAllTimes(){
    let max = 1440;
    let report = document.createElement('div');
    for(let i = 0; i < max; i = i + 10){
        //Check each number for how many sunsets are within 20 minutes of it
        let currentSunsets = findClosest(sunsetData, 60, 1, i);
        //Sort by number of minutes away
        currentSunsets.sort(function(a, b){
            return Math.abs(i-a.MinuteTime) - Math.abs(i - b.MinuteTime);
        });
        //Add to report
        let paragraph = document.createElement('p');
        paragraph.innerText = `Current time: ${i} Sunsets: ${currentSunsets.length} Least time distance: ${i - currentSunsets[0].MinuteTime} Current location ${currentSunsets[0].Latitude} ${currentSunsets[0].Longitude}`;
        //Colour background based on least time distance
        let difference = Math.abs(i - currentSunsets[0].MinuteTime);
        if(difference < 10){
            paragraph.style.backgroundColor = "green";
        }
        else if(difference < 30){
            paragraph.style.backgroundColor = "yellow";
        }
        else if(difference < 60){
            paragraph.style.backgroundColor = "orange";
        }
        else {
            paragraph.style.backgroundColor = "red";
        }
        report.appendChild(paragraph);
    }
 
    document.querySelector('body').appendChild(report);
}

function findClosest (sunsetData, sunsetWindow, number, currentTime) {
    let currentSunsets = [];
    for(let i=0; i < sunsetData.length; i++){
        let timeToCheck = sunsetData[i].MinuteTime;
        if(timeToCheck < currentTime-100){
            timeToCheck += 1440;
        }
        let timeDifference = timeToCheck - currentTime;
        if(timeDifference < sunsetWindow && timeDifference >= -afterWindow){
            currentSunsets.push(sunsetData[i]);
        }
    }
    if(currentSunsets.length < number){
        currentSunsets = findClosest(sunsetData, sunsetWindow + 10, number, currentTime);
    }
    return currentSunsets;
}

function statusReport(long, lat, sunsettime, currenttime, currentsunsets){
    let report = document.createElement('div');
    report.classList.add('status-report');
    //Add lat and long statement
    let latlong = document.createElement('p');
    latlong.innerText = `${lat} ${long}`;
    report.appendChild(latlong);
    //Add sunset time statement
    let sunset = document.createElement('p');
    sunset.innerText = `Sunset Time: ${sunsettime}`;
    report.appendChild(sunset);
    //Add current time statement
    let current = document.createElement('p');
    current.innerText = `Current Time: ${currenttime}`;
    report.appendChild(current);
    //Time difference statement
    let difference = document.createElement('p');
    difference.innerText = `Time Difference: ${sunsettime - currenttime}`;
    report.appendChild(difference);
    //Add number of current sunsets
    let number = document.createElement('p');
    number.innerText = `Number of current sunsets: ${currentsunsets.length}`;
    report.appendChild(number);
    //Add report to the page
    document.querySelector('body').appendChild(report);

}

function nextStream(){
    let button = document.querySelector('#next');
    currentIndex++;
    if(currentIndex >= currentSunsets.length){
        currentIndex = 0;
    }
    currentSunset = currentSunsets[currentIndex];
    //Add currrent number to button
    button.innerText = `Next sunset (${currentIndex + 1}/${currentSunsets.length})`;
    renderStream(currentSunset);
}


sunsetData = [
    {
        "Latitude": 35.523503533579486,
        "Longitude": -108.73686990192445,
        "Stream": "https://www.youtube.com/watch?v=sucP6OLOTyI",
        "SunsetTime": "12:23:36 AM",
        "MinuteTime": 23,
        "Description": "the train line in Gallup, New Mexico."
    },
    {
        "Latitude": 32.206944738265854,
        "Longitude": -110.92982378398766,
        "Stream": "https://www.youtube.com/watch?v=vyQp0uUDqcY",
        "Description": "the city of Tucson, Arizona.",
        "SunsetTime": "12:33:26 AM",
        "MinuteTime": 33
    },
    {
        "Stream": "https://www.earthcam.com/usa/arizona/grandcanyon/?cam=grandcanyon",
        "Latitude": 36.27238977535937,
        "Longitude": -112.33796981463627,
        "SunsetTime": "12:34:48 AM",
        "MinuteTime": 34,
        "Description": "the Grand Canyon in Arizona."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=lim5hCR59kw",
        "Latitude": 47.5976928574607,
        "Longitude": -120.66071664996907,
        "Description": "the town of Leavenworth in Washington.",
        "SunsetTime": "11:44:10 PM",
        "MinuteTime": 1420
    },
    {
        "Stream": "https://www.youtube.com/watch?v=NveskAtF9cI",
        "Latitude": 49.31076503202746,
        "Longitude": -124.26420562516078,
        "Description": "Strait of Georgia in British Columbia.",
        "SunsetTime": "12:54:25 AM",
        "MinuteTime": 54
    },
    {
        "Latitude": 60.611696324117155,
        "Longitude": -135.05643201791642,
        "Stream": "https://www.youtube.com/watch?v=9Epu2exCITg",
        "Description": "the town of Whitehorse in the Yukon Territory in Canada.",
        "SunsetTime": "12:59:03 AM",
        "MinuteTime": 59
    },
    {
        "Latitude": 35.1332597369784,
        "Longitude": -118.4509398473113,
        "Stream": "https://www.youtube.com/watch?v=HRsHqh3Gils",
        "Description": "the railroad in Tehachapi, California.",
        "SunsetTime": "12:59:02 AM",
        "MinuteTime": 59
    },
    {
        "Latitude": 49.14600960465461,
        "Longitude": -125.90523165456408,
        "Stream": "https://www.youtube.com/watch?v=84dLnpdqC_U",
        "Description": "the town of Tofino in British Columbia.",
        "SunsetTime": "1:01:23 AM",
        "MinuteTime": 61
    },
    {
        "Latitude": 35.37028734495615,
        "Longitude": -120.86731738610361,
        "Stream": "https://www.youtube.com/watch?v=j5Fj0Pduw0I",
        "Description": "the Morro Bay Rock.",
        "SunsetTime": "1:08:19 AM",
        "MinuteTime": 68
    },
    {
        "Latitude": 37.63239942278591,
        "Longitude": -122.4955555295967,
        "Stream": "https://www.youtube.com/watch?v=u2RZn6TKrU4",
        "Description": "the Sharp Park Beach in Pacifica, California.",
        "SunsetTime": "1:11:09 AM",
        "MinuteTime": 71
    },
    {
        "Latitude": 37.63399834680756,
        "Longitude": -122.49262941801125,
        "Stream": "https://www.youtube.com/live/tz1z6pVktw0?si=s3PSyFnFkKmnafXr",
        "Description": "the Pacifica Pier in California.",
        "SunsetTime": "1:11:08 AM",
        "MinuteTime": 71
    },
    {
        "Latitude": 37.12662623,
        "Longitude": -121.6327436,
        "Stream": "https://www.youtube.com/watch?v=nfX6ty9Q_og",
        "SunsetTime": "1:12:47 AM",
        "MinuteTime": 72,
        "Description": "the town of Morgan Hill in California."
    },
    {
        "Latitude": 61.18206704,
        "Longitude": -149.9708918,
        "Stream": "https://www.youtube.com/watch?v=AQItp_RvMpM",
        "SunsetTime": "2:06:50 AM",
        "MinuteTime": 126,
        "Description": "Lake Hood Seaplane Base in Anchorage, Alaska."
    },
    {
        "Latitude": 58.69322419033267,
        "Longitude": -155.57645154842152,
        "Stream": "https://www.youtube.com/watch?v=dXp23eXXTOU",
        "SunsetTime": "2:34:16 AM",
        "MinuteTime": 154,
        "Description": "Dumpling Mountain in Katmai National Park, Alaska."
    },
    {
        "Latitude": 21.642000670772493,
        "Longitude": -158.06884152980038,
        "Stream": "https://www.youtube.com/watch?v=eBNyINb-Be4",
        "Description": "Waimea Bay in Hawaii.",
        "SunsetTime": "3:56:00 AM",
        "MinuteTime": 236
    },
    {
        "Latitude": 21.26570836,
        "Longitude": -157.8220658,
        "Stream": "https://www.youtube.com/watch?v=6tHEWDnxj2Y",
        "SunsetTime": "3:57:40 AM",
        "MinuteTime": 237,
        "Description": "Waikiki Aquarium, Hawaii."
    },
    {
        "Latitude": -36.83009652981639,
        "Longitude": 174.73276760370615,
        "Stream": "https://www.youtube.com/watch?v=pUnKgU3r1cI",
        "SunsetTime": "6:54:25 AM",
        "MinuteTime": 414,
        "Description": "the Auckland skyline in New Zealand."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=RtTgn7PFUxY",
        "Latitude": -40.90243162165944,
        "Longitude": 176.22696624326926,
        "SunsetTime": "6:55:49 AM",
        "MinuteTime": 415,
        "Description": "Castlepoint Lighthouse in New Zealand."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=BqdaED9_1Qw",
        "Latitude": -41.40640427744111,
        "Longitude": 174.87364120922095,
        "SunsetTime": "7:02:13 AM",
        "MinuteTime": 422,
        "Description": "the Baring Head lighthouse in New Zealand."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=Fzo8jORoQMo",
        "Latitude": -22.3055294999217,
        "Longitude": 166.4379423711553,
        "SunsetTime": "7:06:47 AM",
        "MinuteTime": 426,
        "Description": "the Baie de l'Anse-Vata in New Caledonia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=PaV9QIXFcEQ",
        "Latitude": 42.99585227536449,
        "Longitude": 144.37319503290763,
        "Description": "Kushiro, Japan",
        "SunsetTime": "7:14:51 AM",
        "MinuteTime": 434
    },
    {
        "Stream": "https://www.youtube.com/watch?v=iyn1BT5fKyw",
        "Latitude": 42.91845685463762,
        "Longitude": 143.20208996066293,
        "Description": "Obihiro station in Hokkaido, Japan",
        "SunsetTime": "7:19:41 AM",
        "MinuteTime": 439
    },
    {
        "Latitude": -45.77666044,
        "Longitude": 170.7276024,
        "Stream": "https://www.youtube.com/watch?v=HqLu2QuyPPE",
        "SunsetTime": "7:25:14 AM",
        "MinuteTime": 445,
        "Description": "the southeast tip of New Zealand's South Island."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=NcXNKE2Tw2Y",
        "Latitude": 43.02560565052597,
        "Longitude": 141.32078962957374,
        "Description": "Mount Moiwa viewing platform above Sapporo, Japan.",
        "SunsetTime": "7:27:00 AM",
        "MinuteTime": 447
    },
    {
        "Latitude": 35.65059423,
        "Longitude": 139.7556602,
        "Stream": "https://www.youtube.com/watch?v=n3B8fp-Henc",
        "SunsetTime": "7:50:10 AM",
        "MinuteTime": 470,
        "Description": "Minato City in Tokyo."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=d6W9Q0BGcbo",
        "Latitude": 60.70666622909992,
        "Longitude": 114.95461001190407,
        "SunsetTime": "8:25:45 AM",
        "MinuteTime": 505,
        "Description": "the Lena River in Siberia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=0OtVlfDj2w8",
        "Latitude": -37.14610885877941,
        "Longitude": 146.44901003354593,
        "SunsetTime": "8:48:10 AM",
        "MinuteTime": 528,
        "Description": "the Mount Buller ski resort in Australia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=z_fY1pj1VBw",
        "Latitude": 25.02688789783685,
        "Longitude": 121.57768827636089,
        "SunsetTime": "9:14:56 AM",
        "MinuteTime": 554,
        "Description": "the view from the Taipei 101 skyscraper in Taiwan."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=UCG1aXVO8H8",
        "Latitude": 22.50653213122904,
        "Longitude": 120.95634339753641,
        "SunsetTime": "9:20:25 AM",
        "MinuteTime": 560,
        "Description": "the Duoliang Train Station in Taiwan."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=nJgJG-CzV8E",
        "Latitude": -8.64806211822402,
        "Longitude": 115.1199538922926,
        "SunsetTime": "10:16:37 AM",
        "MinuteTime": 616,
        "Description": "Batu Bolong Beach in Bali."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=JWF1tqCP-SE",
        "Latitude": -8.802014258782473,
        "Longitude": 115.11624156596096,
        "SunsetTime": "10:16:48 AM",
        "MinuteTime": 616,
        "Description": "Dream Land Beach in Bali."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=uakxJIafWcw",
        "Latitude": -31.936296978650258,
        "Longitude": 115.88473011032525,
        "SunsetTime": "10:42:09 AM",
        "MinuteTime": 642,
        "Description": "the city of Perth in Australia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=dqdPFpMeXNs",
        "Latitude": 24.560055809733775,
        "Longitude": -81.80784435157629,
        "SunsetTime": "11:30:54 AM",
        "MinuteTime": 690,
        "Description": "Mallory Square Key West Florida."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=u7OGpYGcjls",
        "Latitude": 27.70061756412224,
        "Longitude": 85.31227986606567,
        "SunsetTime": "11:36:37 AM",
        "MinuteTime": 696,
        "Description": "the Dharahara Tower of Kathmandu, Nepal."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=UK-CLqR7TZE",
        "Latitude": 42.874694302315405,
        "Longitude": 74.60331587255156,
        "SunsetTime": "11:56:31 AM",
        "MinuteTime": 716,
        "Description": "the city of Bishkek, Kyrgyzstan."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=7dE4IjDQJmE",
        "Latitude": 25.111260019732605,
        "Longitude": 55.14085492621604,
        "SunsetTime": "1:40:28 PM",
        "MinuteTime": 820,
        "Description": "the Dubai Marina in the United Arab Emirates."
    },
    {
        "Latitude": 59.98722227251035,
        "Longitude": 30.178439450739535,
        "Stream": "https://www.youtube.com/watch?v=Km9rQm1BRkQ",
        "Description": "the Lakhta Center in St. Petersburg, Russia.",
        "SunsetTime": "2:02:09 PM",
        "MinuteTime": 842
    },
    {
        "Stream": "https://www.youtube.com/watch?v=h1wly909BYw",
        "Latitude": 59.95873079023593,
        "Longitude": 30.301845644582606,
        "SunsetTime": "2:06:56 PM",
        "MinuteTime": 846,
        "Description": "the city of St. Petersburg, Russia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=dhVzWNos718",
        "Latitude": 59.95873079023593,
        "Longitude": 30.301845644582606,
        "SunsetTime": "2:06:56 PM",
        "MinuteTime": 846,
        "Description": "the city of St. Petersburg, Russia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=Gl4a_uD9wGk",
        "Latitude": 40.7312054198127,
        "Longitude": 36.66928653351851,
        "SunsetTime": "2:31:57 PM",
        "MinuteTime": 871,
        "Description": "the city of Sivas in Turkey."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=NUp9CIX4AAE",
        "Latitude": 38.42400591631133,
        "Longitude": 27.13922874783693,
        "SunsetTime": "3:13:54 PM",
        "MinuteTime": 913,
        "Description": "the city of Izmir in Turkey."
    },
    {
        "Latitude": -2.5082113823621075,
        "Longitude": 37.64517888801091,
        "Stream": "https://www.youtube.com/watch?v=39uYW98qOV0",
        "SunsetTime": "3:20:08 PM",
        "MinuteTime": 920,
        "Description": "the Donyo Lodge in Kenya."
    },
    {
        "Latitude": 37.9188015849022,
        "Longitude": 23.701033719633905,
        "Stream": "https://www.youtube.com/watch?v=8I26xD8qBMo",
        "SunsetTime": "3:30:42 PM",
        "MinuteTime": 930,
        "Description": "the Poseiden Hotel in Athens, Greece."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=5VjoZqNyYYI",
        "Latitude": 60.60189953803932,
        "Longitude": 7.504445736092017,
        "SunsetTime": "3:35:12 PM",
        "MinuteTime": 935,
        "Description": "the train station in Finse, Norway."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=l_8DrACHpwY",
        "Latitude": -37.822287953687564,
        "Longitude": 144.96024855058334,
        "SunsetTime": "3:35:35 PM",
        "MinuteTime": 935,
        "Description": "the city of Melbourne, Australia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=QT3HG6g27Qk",
        "Latitude": 50.10589662239449,
        "Longitude": 14.474104537445296,
        "SunsetTime": "3:41:27 PM",
        "MinuteTime": 941,
        "Description": "the train station in Libeň, Czechia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=0jUGiYZKAMg",
        "Latitude": 50.11066089665043,
        "Longitude": 14.267859581085853,
        "SunsetTime": "3:42:15 PM",
        "MinuteTime": 942,
        "Description": "the Vaclav Havel Airport, Czechia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=EHgE96uSTdk",
        "Latitude": 50.14401585271214,
        "Longitude": 13.770020477344715,
        "SunsetTime": "3:44:10 PM",
        "MinuteTime": 944,
        "Description": "the train station in Lužná u Rakovníka, Czechia."
    },
    {
        "Latitude": 45.15264821,
        "Longitude": 14.71921729,
        "Stream": "https://www.youtube.com/watch?v=7TMUvbju4zM",
        "SunsetTime": "3:54:20 PM",
        "MinuteTime": 954,
        "Description": "the town of Hvar in Croatia."
    },
    {
        "Latitude": 40.63495479269057,
        "Longitude": 16.283180660366636,
        "Stream": "https://www.youtube.com/watch?v=0yGqsXUnBLU",
        "SunsetTime": "3:56:04 PM",
        "MinuteTime": 956,
        "Description": "the town of Grassano in Italy."
    },
    {
        "Latitude": 40.816993435404655,
        "Longitude": 14.332471907333709,
        "Stream": "https://www.youtube.com/watch?v=LO2Fvujwc8M",
        "SunsetTime": "4:03:34 PM",
        "MinuteTime": 983,
        "Description": "the Gulf of Naples in Italy."
    },
    {
        "Latitude": 45.86841757108755,
        "Longitude": 8.770544450995274,
        "Stream": "https://www.youtube.com/watch?v=ZXTYuA6apHM",
        "SunsetTime": "4:16:44 PM",
        "MinuteTime": 976,
        "Description": "the G.V. Schiaparelli Observatory in Italy."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=asO_10T0k2k",
        "Latitude": 43.554981131375115,
        "Longitude": 7.009749980789008,
        "SunsetTime": "4:25:22 PM",
        "MinuteTime": 985,
        "Description": "the city of Cannes, France."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=zeKy2psmeAk",
        "Latitude": 50.36000944163908,
        "Longitude": 1.5571273558692322,
        "SunsetTime": "4:32:26 PM",
        "MinuteTime": 992,
        "Description": "the beach at Fort Mahon, France."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=7B0-m_mcKf0",
        "Latitude": 49.85585649686379,
        "Longitude": 0.6999739880969486,
        "SunsetTime": "4:37:05 PM",
        "MinuteTime": 997,
        "Description": "the beach at Saint-Valery-en-Caux, France."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=St7aTfoIdYQ",
        "Latitude": 51.752937990451215,
        "Longitude": -1.2558301418602253,
        "SunsetTime": "4:40:06 PM",
        "MinuteTime": 1000,
        "Description": "the city of Oxford, England."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=PLQJVd367J0",
        "Latitude": 49.50767933721028,
        "Longitude": 0.107241291014487,
        "SunsetTime": "4:40:17 PM",
        "MinuteTime": 1000,
        "Description": "the city of Le Havre, France."
    },
    {
        "Latitude": -24.43,
        "Longitude": 18.100833,
        "Stream": "https://www.youtube.com/watch?v=fPd7Ys7FC0I",
        "SunsetTime": "5:01:51 PM",
        "MinuteTime": 1021,
        "Description": "the Kalahari Desert in Namibia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=QGtmGxXSjxc",
        "Latitude": -34.00166798692802,
        "Longitude": 18.529667849848636,
        "SunsetTime": "5:15:00 PM",
        "MinuteTime": 1035,
        "Description": "Cape Town, South Africa."
    },
    {
        "Latitude": 36.6772965026265,
        "Longitude": -4.490231107492708,
        "Stream": "https://www.youtube.com/watch?v=piWvAcJ9iow",
        "SunsetTime": "5:23:05 PM",
        "MinuteTime": 1043,
        "Description": "the airport in Malaga, Spain."
    },
    {
        "Latitude": 38.58750344927647,
        "Longitude": -9.210034286508307,
        "Stream": "https://www.youtube.com/watch?v=MSPqMb6wDTk",
        "SunsetTime": "5:38:55 PM",
        "MinuteTime": 1058,
        "Description": "Praia da Fonte da Telha, Portugal."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=lEO4h5isn3M",
        "Latitude": 30.515116948958905,
        "Longitude": -9.680308059343158,
        "SunsetTime": "5:52:43 PM",
        "MinuteTime": 1072,
        "Description": "Banana Beach in the city of Agadir, Morocco."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=AAlo3eCPVbk",
        "Latitude": 28.351122888082394,
        "Longitude": -17.40876721322894,
        "SunsetTime": "6:26:28 PM",
        "MinuteTime": 1106,
        "Description": "Lanzarote Airport in the Canary Islands off the west coast of Africa."
    },
    {
        "Latitude": 67.00807323,
        "Longitude": -50.70348434,
        "Stream": "https://www.youtube.com/watch?v=dG4pb20EqJc",
        "SunsetTime": "6:58:34 PM",
        "MinuteTime": 1138,
        "Description": "The airport at Kangerlussuaq, Greenland."
    },
    {
        "Latitude": 64.19150267,
        "Longitude": -51.67504107,
        "Stream": "https://www.youtube.com/watch?v=HSn9ca4fHyY",
        "SunsetTime": "7:19:52 PM",
        "MinuteTime": 1159,
        "Description": "The airport at Nuuk, Greenland."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=dQzt2xtk7kY",
        "Latitude": 45.363359256745724,
        "Longitude": -63.27491088159583,
        "SunsetTime": "9:02:40 PM",
        "MinuteTime": 1262,
        "Description": "an inlet to the Bay of Fundy in Truro, Nova Scotia."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=jV6CHwUjLkk",
        "Latitude": 44.38977996838038,
        "Longitude": -68.29089376676836,
        "SunsetTime": "9:24:40 PM",
        "MinuteTime": 1284,
        "Description": "the Bar Harbor Inn in Maine."
    },
    {
        "Latitude": 48.374139544801864,
        "Longitude": -71.19208989901963,
        "Stream": "https://www.youtube.com/watch?v=NkmSJ-db9V0",
        "Description": "the port of Saguenay in Quebec.",
        "SunsetTime": "9:24:39 PM",
        "MinuteTime": 1284
    },
    {
        "Stream": "https://www.youtube.com/watch?v=MqeTI86MT_4",
        "Latitude": 45.55142106193648,
        "Longitude": -69.71732795364304,
        "SunsetTime": "9:28:02 PM",
        "MinuteTime": 1288,
        "Description": "the Big Moose Mountain Ski Area in Maine."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=5qVHjf7hKZU",
        "Latitude": 44.28202911665705,
        "Longitude": -71.31103790612887,
        "Description": "Mt Washington Observatory in New Hampshire.",
        "SunsetTime": "9:34:14 PM",
        "MinuteTime": 1294
    },
    {
        "Latitude": 42.97739898,
        "Longitude": -70.60985426,
        "Stream": "https://www.youtube.com/watch?v=_-D6YQjAtAM",
        "SunsetTime": "9:39:19 PM",
        "MinuteTime": 1299,
        "Description": "Star Island, off the coast of New Hampshire."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=xt7gTHpBuqM",
        "Latitude": 42.36549378496692,
        "Longitude": -71.07054615703109,
        "SunsetTime": "9:39:37 PM",
        "MinuteTime": 1299,
        "Description": "the Boston skyline from the Boston Museum of Science."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=SPj4hMttgJM",
        "Latitude": 18.200972399985552,
        "Longitude": -63.08728385451675,
        "SunsetTime": "9:41:14 PM",
        "MinuteTime": 1301,
        "Description": "the island of Anguilla in the Caribbean."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=rAK1Xy4jqDg",
        "Latitude": 45.46974516191286,
        "Longitude": -73.52650120720843,
        "SunsetTime": "9:43:25 PM",
        "MinuteTime": 1303,
        "Description": "the Montreal skyline from the Pont Samuel de Champlain bridge."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=K_FOP7_wGPE",
        "Latitude": 18.343587003955648,
        "Longitude": -64.77437094695814,
        "SunsetTime": "9:47:49 PM",
        "MinuteTime": 1307,
        "Description": "the island of St. John in the Caribbean."
    },
    {
        "Latitude": 41.0327496,
        "Longitude": -71.97291041,
        "Stream": "https://www.youtube.com/watch?v=iEgvwUslEUg",
        "SunsetTime": "9:48:07 PM",
        "MinuteTime": 1308,
        "Description": "the East Lake in Montauk, New York."
    },
    {
        "Latitude": 41.06165224097914,
        "Longitude": -71.91263928769277,
        "Stream": "https://www.youtube.com/watch?v=FaBnAZREpew",
        "SunsetTime": "10:17:33 PM",
        "MinuteTime": 1337,
        "Description": "Lake Erie from the town of North East, Pennsylvania."
    },
    {
        "Latitude": 33.77629282779654,
        "Longitude": -77.95152951662084,
        "Stream": "https://www.youtube.com/watch?v=pW_S5RTdnSQ",
        "Description": "the view from the Frying Pan Tower off the coast of Cape Fear, North Carolina.",
        "SunsetTime": "10:19:15 PM",
        "MinuteTime": 1339
    },
    {
        "Latitude": 29.89107933836368,
        "Longitude": -81.30052723888097,
        "Stream": "https://www.youtube.com/watch?v=FLci2xciBb4",
        "SunsetTime": "10:41:31 PM",
        "MinuteTime": 1361,
        "Description": "the town of St Augustine in Florida."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=ATbtGvbExP4",
        "Latitude": 36.166357712039975,
        "Longitude": -86.77164385492853,
        "Description": "the Nashville skyline in Tennessee.",
        "SunsetTime": "10:50:46 PM",
        "MinuteTime": 1370
    },
    {
        "Latitude": 46.76654048,
        "Longitude": -92.11322902,
        "Stream": "https://www.youtube.com/watch?v=kNyX6Wn6-4M",
        "SunsetTime": "10:58:02 PM",
        "MinuteTime": 1378,
        "Description": "the Duluth Harbor in Minnesota."
    },
    {
        "Latitude": 47.91352337383147,
        "Longitude": -97.05822873277728,
        "Stream": "https://www.youtube.com/watch?v=mpcvRHLGBRw",
        "SunsetTime": "11:15:24 PM",
        "MinuteTime": 1395,
        "Description": "the town of Grand Forks in North Dakota."
    },
    {
        "Latitude": 39.7497255590648,
        "Longitude": -104.9782398416428,
        "Stream": "https://www.youtube.com/watch?v=8-9LrAFMTXM",
        "Description": "the Denver skyline in Colorado.",
        "SunsetTime": "11:57:28 PM",
        "MinuteTime": 1437
    },
    {
        "Latitude": 19.023215237729556,
        "Longitude": -98.23200400650532,
        "Stream": "https://www.youtube.com/watch?v=jLyge5RKEbQ",
        "Description": "the town of Puebla with a view of the Popocatépetl volcano in Mexico.",
        "SunsetTime": "11:59:54 PM",
        "MinuteTime": 1439
    },
    {
        "Stream": "https://www.youtube.com/watch?v=y1qDzW_yWko",
        "Latitude": 36.12116490271403, 
        "Longitude": -115.16219062479378,
        "Description": "the Sphere and Las Vegas Skyline in Nevada.",
    },
    {
        "Stream": "https://www.youtube.com/watch?v=8bNPqxDdoJQ",
        "Latitude": 34.66022146730858, 
        "Longitude": -106.7848831108465, 
        "Description": "the railway in Belen, New Mexico.",
    },
    {
        "Stream": "https://www.youtube.com/watch?v=Uqq-1HPjJ2o",
        "Latitude": 29.75598425858256, 
        "Longitude": -95.35328188804534,
        "Description": "railway and skyline view in Houston, Texas"
    },
    {
        "Stream": "https://www.youtube.com/watch?v=Xnn6jt1_vEQ",
        "Latitude": 30.44963695685031, 
        "Longitude": -97.57062601634816,
        "Description": "the town of Pflugerville in Texas."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=MwcqP3ta6RI",
        "Latitude": 51.07464073426902, 
        "Longitude": -114.0562894603504,
        "Description": "the Calgary skyline in Alberta, Canada."
    },
    {
        "Stream": "https://www.youtube.com/watch?v=3ATYHKN2hIg",
        "Latitude": 21.881477798854437, 
        "Longitude":-159.47566559956903,
        "Description": "the town of Koloa in Hawaii."
    }
]

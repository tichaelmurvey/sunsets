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
    //Get sunset data
    let sunsetData = await fetch('https://sunset-data-1-michaelmont.replit.app/')
    .then(response => response.json())
    console.log(sunsetData.length);
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
    //checkAllTimes();
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
        iframe.src = `https://www.youtube.com/embed/${videoID}?autoplay=1&mute=1&fullscreen=1`;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.frameborder = "0";
        //Start playing the video automatically

        iframe.allow = "fullscreen";
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
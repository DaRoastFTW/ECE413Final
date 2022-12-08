$(function () {  // Loads when website is refreshed or initially entered
  $("#nav-placeholder").load("navbar.html");
  var token = localStorage.getItem("token"); // JWT token
  var particle_token = localStorage.getItem("particle-token");
  if (token != null && particle_token != null && particle_token != "undefined") {
    const tokenGen = { webToken: token, particleToken: particle_token };

    $.ajax({ //Initially pulls devices on account from particle token
      url: 'account/getDevices',
      method: 'GET',
      contentType: 'application/json',
      data: tokenGen,
      dataType: 'json'



    })
      .done(function (data, textStatus, jqXHR) {

        buildParticleList(data.devices.body);

      })
      .fail(function (data, textStatus, errorThrown) { // Redirects to particle login to get particle token
        var error = JSON.parse(data.responseText).msg;
        if (error == "invalid_token") {
          window.location.replace("particle.html");
        }

      })


    $.ajax({ // Initially pulls devices stored locally
      url: 'account/getLocalDevices',
      method: 'GET',
      contentType: 'application/json',
      data: tokenGen,
      dataType: 'json'



    })
      .done(function (data, textStatus, jqXHR) {



        buildList(data);
        displayFrequencyAndTimes();
        var date = new Date();
        var year = date.getYear()
        var dateVal = (date.getYear() + 1900) + "-" + (date.getMonth() + 1).toString().padStart(2, "0") + "-" + date.getDate().toString().padStart(2, "0");
        $("#dob").val(dateVal);
        updateGraph();
        weekSummary();

      })
      .fail(function (data, textStatus, errorThrown) { // Redirects to particle login to get particle token
        var error = JSON.parse(data.responseText).msg;
        if (error == "invalid_token") {
          window.location.replace("particle.html");
        }

      })


  }
  else if (token == null) { // Redirects if JWT is invalid
    window.location.replace("login.html");
  }
  else if (particle_token == null || particle_token == "undefined") { // Redirects if particle token doesn't exist
    window.location.replace("particle.html");
  }



});



function addDevice(name) { // Code that adds the device to the local account



  if (name != null) {
    const cust_name = { device: name, token: localStorage.getItem("token") };
    $.ajax({
      url: 'account/addDevice',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(cust_name),
      dataType: 'json'



    })
      .done(function (data, textStatus, jqXHR) {



        if (data.message) {
          window.location.replace("account.html");
        }
        else {
          buildList(data);
        }

      })
      .fail(function (data, textStatus, errorThrown) {
        alert(JSON.parse(data.responseText).message);
        window.location.replace("account.html");

      })
  }




}


function updateTime() { // Code that updates the time range being used for measurement
  var beginningTime = $("#beginningTime").val().split(":");
  var endTime = $("#endTime").val().split(":");
  var deviceName = $("#linkedDeviceList li:first").text();
  var startHours = beginningTime[0];
  var startMinutes = beginningTime[1];
  var endHours = endTime[0];
  var endMinutes = endTime[1];

  var startTime = { hours: startHours, minutes: startMinutes };
  var finishTime = { hours: endHours, minutes: endMinutes };

  var package = { start: startTime, end: finishTime, particleToken: localStorage.getItem("particle-token"), webToken: localStorage.getItem("token"), particleDeviceName: deviceName };

  $.ajax({
    url: 'argon/sendStartEnd',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(package),
    dataType: 'json'
  })
    .done(function (data, textStatus, jqXHR) {
      alert("Done");
    })
    .fail(function (data, textStatus, errorThrown) {
      //alert("Fail");
    })
}

function updateFrequency() {
  var freq = $("#frequencyText").val();
  var deviceName = $("#linkedDeviceList li:first").text(); // Pulls the device name from the element in HTML

  var package = { frequency: freq, particleToken: localStorage.getItem("particle-token"), webToken: localStorage.getItem("token"), particleDeviceName: deviceName };
  $.ajax({
    url: 'argon/sendFrequency',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(package),
    dataType: 'json'



  })
    .done(function (data, textStatus, jqXHR) {
      alert("Done");
    })
    .fail(function (data, textStatus, errorThrown) {
      //alert("Fail");
    })
}

function buildParticleList(info) { // Creating list for particle
  $("#particleDeviceList").html("<lh>Particle Devices: </lh>");
  if (info.length == 0) {
    $("<li>Please visit <a href='https://build.particle.io/build/new' target='_blank'>Particle</a> to register your devices</li>").appendTo("#particleDeviceList");
  }
  for (let i = 0; i < info.length; i++) { // Creating list with ancillary elements for particle list
    var device = info[i].name;
    var id_name = device.split(" ").join("_");
    $("<li>" + info[i].name + "<input type= 'submit' class = 'btn btn-primary' id = '" + id_name + "' value = 'Link'></li>").appendTo("#particleDeviceList");
    $("#" + id_name).click(() => { addDevice(info[i].name) });

  }

}
function buildList(data) { // Creating list from local account
  $("#linkedDeviceList").html("<lh>Linked Devices: </lh>");
  if (data.length == 0) {
    $("<li>Please link Particle Devices to Rine Heart Monitoring</li>").appendTo("#linkedDeviceList");
  }
  for (let i = 0; i < data.length; i++) { // Creating list with ancillary elements for local list
    var device = data[i];
    var id_name = device.split(" ").join("_");
    $("#" + id_name).prop("disabled", true);
    $("#" + id_name).val("Linked");
    $("<li>" + device + "<input type= 'submit' class = 'btn btn-primary' id = '" + id_name + "' value = 'Remove'></li>").appendTo("#linkedDeviceList");
    $("#" + id_name).click(() => { removeDevice(device) });

  }

}

function removeDevice(device) {
  const cust_name = { device: device, token: localStorage.getItem("token") };
  var id_name = device.split(" ").join("_");

  $.ajax({
    url: 'account/removeDevice',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(cust_name),
    dataType: 'json'



  })
    .done(function (data, textStatus, jqXHR) {


      //alert(deviceData);
      //Call function to build unordered list
      buildList(data);
      $("#" + device).prop("disabled", false);
      $("#" + id_name).val("Link");
      //window.location.replace("account.html");

    })
    .fail(function (data, textStatus, errorThrown) {
      alert(JSON.parse(data.responseText).msg);
      // fixed 

    })
}

function displayFrequencyAndTimes() { // Pulls frequency and times from the server on initial entry into page or refresh
  var deviceName = $("#linkedDeviceList li:first").text();
  var webTokenObj = {
    webToken: localStorage.getItem("token"), particleToken: localStorage.getItem("particle-token"), deviceName: deviceName
  };
  $.ajax({
    url: 'account/getFrequencyAndTimes',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(webTokenObj),
    dataType: 'json'
  })

    .done(function (data, textStatus, jqXHR) {
      $("#frequencyText").append(data.frequency);
      // Output treatment for time
      if (data.startTime.hours < 10) {
        data.startTime.hours = "0" + data.startTime.hours;
      }
      if (data.startTime.minutes < 10) {
        data.startTime.minutes = "0" + data.startTime.minutes;
      }
      if (data.endTime.hours < 10) {
        data.endTime.hours = "0" + data.endTime.hours;
      }
      if (data.endTime.minutes < 10) {
        data.endTime.minutes = "0" + data.endTime.minutes;
      }
      startTimeString = data.startTime.hours + ":" + data.startTime.minutes;
      endTimeString = data.endTime.hours + ":" + data.endTime.minutes;
      $("#beginningTime").val(startTimeString);
      $("#endTime").val(endTimeString);
      // alert("Should be ending: " + endTimeString);
    })
    .fail(function (data, textStatus, errorThrown) {
      alert(JSON.parse(data.responseText).message);
    })
}


function updateGraph() { // Pulling data for graphs
  var day = $("#dob").val();
  // const date = new Date(day);
  const data = { date: day, webToken: localStorage.getItem("token") };
  $.ajax({
    url: 'account/getDailyData',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(data),
    dataType: 'json'



  })
    .done(function (data, textStatus, jqXHR) {
      var timeArray = data.timestamps;
      var heartArray = data.pulses;
      var spo2Array = data.spo2s;


      // Finding minimum, maximum, and average heart rate and spO2
      var minHeart = 1000;
      var minHeartIndex = -1;
      for (var i = 0; i < heartArray.length; i++) {
        if (heartArray[i] < minHeart) {
          minHeart = heartArray[i];
          minHeartIndex = i;
        }
      }
      $("#minHeartRateDaily").html("Heart Rate: " + minHeart + " BPM @ " + timeArray[minHeartIndex]);

      var minSPO2 = 1000;
      var minSPO2Index = -1;
      for (var i = 0; i < spo2Array.length; i++) {
        if (spo2Array[i] < minSPO2) {
          minSPO2 = spo2Array[i];
          minSPO2Index = i;
        }
      }
      $("#minBloodO2Daily").html("Blood O2: " + minSPO2 + " % @ " + timeArray[minSPO2Index]);

      var maxHeart = -1;
      var maxHeartIndex = -1;
      for (var i = 0; i < heartArray.length; i++) {
        if (heartArray[i] > maxHeart) {
          maxHeart = heartArray[i];
          maxHeartIndex = i;
        }
      }
      $("#maxHeartRateDaily").html("Heart Rate: " + maxHeart + " BPM @ " + timeArray[maxHeartIndex]);

      var maxSPO2 = -1;
      var maxSPO2Index = -1;
      for (var i = 0; i < spo2Array.length; i++) {
        if (spo2Array[i] > maxSPO2) {
          maxSPO2 = spo2Array[i];
          maxSPO2Index = i;
        }
      }
      $("#maxBloodO2Daily").html("Blood O2: " + maxSPO2 + " % @ " + timeArray[maxSPO2Index]);

      var heartSum = 0;
      for (var i = 0; i < heartArray.length; i++) {
        heartSum += heartArray[i];
      }

      var avgHeart = heartSum / heartArray.length;
      $("#avgHeartRateDaily").html("Heart Rate: " + avgHeart.toFixed(2) + " BPM");

      var spo2Sum = 0;
      for (var i = 0; i < spo2Array.length; i++) {
        spo2Sum += spo2Array[i];
      }

      var avgSpo2 = spo2Sum / spo2Array.length;
      $("#avgBloodO2Daily").html("Blood O2: " + avgSpo2.toFixed(2) + " %");

      //Plot graph
      var heartData = {
        x: timeArray,
        y: heartArray,
        type: 'scatter'


      };
      //plots the data. Right now it uses var data It seems to need var data. but i will try my best. 
      //Creating the Layout for the Heart Rate Graph
      var heartRateLayout = {
        title: 'Detailed Daily View Heart Rate',
        autosize: true,
        width: 500,
        height: 500,
        margin: {
          l: 50,
          r: 50,
          b: 100,
          t: 100,
          pad: 4
        },
        xaxis: {
          title: 'Time of Day',
          showgrid: false,
          showspikes: true,
          spikemode: "toaxis"


        }, yaxis: {
          title: 'Heart Rate Scatterplot',
          showgrid: false,
          showspikes: true,
          spikemode: 'toaxis'




        }, colorway: ['#FF0000'],
        font: { //"Comic Sans MS", "Comic Sans","Bradley Hand" ,cursive;
          family: "Comic Sans MS , Comic Sans, Bradley Hand"
        }

      };
      const config = {
        displayModeBar: false, // this is the line that hides the bar.
      };
      var data = [heartData];
      heartRate = document.getElementById('heartRate');
      Plotly.newPlot(heartRate, data, heartRateLayout, config);

      //Layout of Blood o2

      var bloodO2Layout = {
        title: 'Detailed Daily View Blood O2 %',
        autosize: true,
        width: 500,
        height: 500,
        margin: {
          l: 50,
          r: 50,
          b: 100,
          t: 100,
          pad: 4,

        },
        paper_bgcolor: "rgb(240,255,255)",
        plot_bgcolor: "rgb(240,255,255)",
        xaxis: {
          title: 'Time of Day',
          showgrid: false,
          showspikes: true,
          spikemode: "toaxis"


        }, yaxis: {
          title: 'Blood O2 Scatterplot',
          showgrid: false,
          showspikes: true,
          spikemode: 'toaxis'

        }, font: { //"Comic Sans MS", "Comic Sans","Bradley Hand" ,cursive;
          family: "Comic Sans MS , Comic Sans, Bradley Hand"
        }

      };
      var bloodData = {
        x: timeArray,
        y: spo2Array,
        type: 'scatter'

      };

      // Interesting it looks like we just need to put the data in an array. 
      // This plots Blood O2. Just need the data.
      var bloodPlot = [bloodData];

      bloodO2 = document.getElementById('bloodO2');
      Plotly.newPlot(bloodO2, bloodPlot, bloodO2Layout, config);

    })
    .fail(function (data, textStatus, errorThrown) {
      alert(JSON.parse(data.responseText).msg);
      // fixed 

    })
}

function weekSummary() {
  // Getting weekly data for the user
  const data = { webToken: localStorage.getItem("token") };
  $.ajax({
    url: 'account/getWeeklyData',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(data),
    dataType: 'json'
  })

    .done(function (data, textStatus, jqXHR) {
      $("#averageWeekly").html("Average Heart Rate: " + data.avgHeartRate + " BPM, Average Blood O2: " + data.avgSPO2 + "%");
      $("#minimumWeekly").html("Minimum Heart Rate: " + data.minHeart + " BPM : " + data.minHeartTime + ", Minimum Blood O2: " + data.minSPO2 + "% : " + data.minSPO2Time);
      $("#maximumWeekly").html("Maximum Heart Rate: " + data.maxHeart + " BPM : " + data.maxHeartTime + ", Maximum Blood O2: " + data.maxSPO2 + "% : " + data.maxSPO2Time);
    })
    .fail(function (data, textStatus, errorThrown) {
      alert(JSON.parse(data.responseText).message);
    })
}


// This is where we will gather data from the particle device. 




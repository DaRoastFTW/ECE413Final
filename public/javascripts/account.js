$(function () {
  $("#nav-placeholder").load("navbar.html");
  var token = localStorage.getItem("token");
  var particle_token = localStorage.getItem("particle-token");
  if (token != null && particle_token != null) {
    const tokenGen = { webToken: token, particleToken: particle_token };

    $.ajax({
      url: 'account/getDevices',
      method: 'GET',
      contentType: 'application/json',
      data: tokenGen,
      dataType: 'json'



    })
      .done(function (data, textStatus, jqXHR) {


        //alert(deviceData);
        //Call function to build unordered list
        buildParticleList(data.devices.body);


      })
      .fail(function (data, textStatus, errorThrown) {
        var error = JSON.parse(data.responseText).msg;
        if (error == "invalid_token") {
          window.location.replace("particle.html");
        }
        // fixed 

      })


    $.ajax({
      url: 'account/getLocalDevices',
      method: 'GET',
      contentType: 'application/json',
      data: tokenGen,
      dataType: 'json'



    })
      .done(function (data, textStatus, jqXHR) {


        //alert(deviceData);
        //Call function to build unordered list
        buildList(data);
        displayFrequencyAndTimes();

      })
      .fail(function (data, textStatus, errorThrown) {
        var error = JSON.parse(data.responseText).msg;
        if (error == "invalid_token") {
          window.location.replace("particle.html");
        }
        // fixed 

      })


  }
  else if (token == null) {
    window.location.replace("login.html");
  }
  else if (particle_token == null) {
    window.location.replace("particle.html");
  }

  

});

// $("#button").click(addDevice);


function addDevice(name) {



  //let name = prompt("Enter name of Device: ");
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


        //alert(deviceData);
        //Call function to build unordered 
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
        // fixed 

      })
  }




}


function updateTime() {
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
  var deviceName = $("#linkedDeviceList li:first").text();

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

function buildParticleList(info) {
  $("#particleDeviceList").html("<lh>Particle Devices: </lh>");
  if (info.length == 0) {
    $("<li>Please visit <a href='https://build.particle.io/build/new' target='_blank'>Particle</a> to register your devices</li>").appendTo("#particleDeviceList");
  }
  for (let i = 0; i < info.length; i++) {
    var device = info[i].name;
    var id_name = device.split(" ").join("_");
    $("<li>" + info[i].name + "<input type= 'submit' class = 'btn btn-primary' id = '" + id_name + "' value = 'Link'></li>").appendTo("#particleDeviceList");
    $("#" + id_name).click(() => { addDevice(info[i].name) });

  }

}
function buildList(data) {
  $("#linkedDeviceList").html("<lh>Linked Devices: </lh>");
  if (data.length == 0) {
    $("<li>Please link Particle Devices to Rine Heart Monitoring</li>").appendTo("#linkedDeviceList");
  }
  for (let i = 0; i < data.length; i++) {
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

function displayFrequencyAndTimes() {
  var deviceName = $("#linkedDeviceList li:first").text();
  var webTokenObj = {
    webToken: localStorage.getItem("token"), particleToken: localStorage.getItem("particle-token"), deviceName: deviceName};
  $.ajax({
    url: 'account/getFrequencyAndTimes',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(webTokenObj),
    dataType: 'json'
  })

    .done(function (data, textStatus, jqXHR) {
      $("#frequencyText").append(data.frequency);
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

TESTER = document.getElementById('tester');
Plotly.newPlot(TESTER, [{
  x: [1, 2, 3, 4, 5],
  y: [1, 2, 4, 8, 16]
}], {
  margin: { t: 0 }
});

$(function () {
  $("#nav-placeholder").load("navbar.html");
  var token = localStorage.getItem("token");
  var particle_token = localStorage.getItem("particle-token")
  if (token != null && particle_token != null) {
    const tokenGen = { webToken: token, particleToken: particle_token};

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
        buildList(data.devices.body);


      })
      .fail(function (data, textStatus, errorThrown) {
        var error = JSON.parse(data.responseText).msg;
        if(error == "invalid_token"){
          window.location.replace("particle.html");
        }
        // fixed 

      })
  }
  else if(token == null) {
    window.location.replace("login.html");
  }
  else if(particle_token == null){
    window.location.replace("particle.html");
  }
});

$("#button").click(addDevice);


function addDevice() {



  let name = prompt("Enter name of Device: ");

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
          alert(data.message);
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
function buildList(info) {
  $("#deviceList").html("");

  for (let i = 0; i < info.length; i++) {
    var device = info[i].name;
    id_name = device.split(" ").join("_");
    $("<li>" + info[i].name + "<input type= 'submit' class = 'btn btn-primary' id = '" + id_name + "' value = '&times'></li>").appendTo("#deviceList");
    $("#" + id_name).click(() => { removeDevice(info[i].name) });

  }

}

function removeDevice(device) {


  const cust_name = { device: device, token: localStorage.getItem("token") };
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

    })
    .fail(function (data, textStatus, errorThrown) {
      alert(JSON.parse(data.responseText).msg);
      // fixed 

    })
}

        TESTER = document.getElementById('tester');
        Plotly.newPlot( TESTER, [{
        x: [1, 2, 3, 4, 5],
        y: [1, 2, 4, 8, 16] }], {
        margin: { t: 0 } } );

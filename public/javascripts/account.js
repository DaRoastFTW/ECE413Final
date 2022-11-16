$(function(){
    $("#nav-placeholder").load("navbar.html");
  });

  $("#button").click(addDevice);

  function addDevice(){
   

    
    let name = prompt("Enter name of Device: ");

    $.ajax({
        url: /*FIX Ary we need  the new info*/'device/addDevice',
        method: 'POST',
        contentType: 'application/json',
        data: name,
        dataType: 'json'
  
  
  
      })
      .done(function (data, textStatus, jqXHR) {
        //Need Mongodb function to retreive updated list of devices for this user. 

        })
        .fail(function(data, textStatus, errorThrown){
          alert(JSON.parse(data.responseText).msg);
          // fixed 
  
        })

    


  }
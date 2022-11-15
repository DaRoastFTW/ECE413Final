$(function(){
    //check for session?
    var token = localStorage.getItem("token");
    if (token != null){
        $("#slot1").html('<a class="nav-link" href="account.html">Account Settings</a>');
        $("#slot2").html('<a class="nav-link" onclick = "logout()">Logout</a>');
    }

  });

  function logout() {

    localStorage.removeItem("token");
    window.location.replace("index.html");



  }
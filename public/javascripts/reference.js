//Add navbar
$(function () {
  $("#nav-placeholder").load("navbar.html");
});
// Easter egg
$("#pika").hover(function () {
  $("body").css("background-image", "url('images/pika.png')");

}, function () {
  $("body").css("background-image", "none");

});
var countDownDate = new Date("Oct 21, 2019 15:37:25").getTime();

var x = setInterval(function() {
    var now = new Date().getTime();

    var distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("demo").innerHTML = days + "d " + hours + "h "+ minutes + "m " + seconds + "s ";
    document.getElementById("demo-2").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

    // If the count down is finished, write some text 
    if (distance < 0) {
        clearInterval(x);
        document.getElementById("demo").innerHTML = "EXPIRED";
        document.getElementById("demo-2").innerHTML = "EXPIRED";
    }
}, 1000);

$(function () {
    $('[data-toggle="tooltip-1"]').tooltip();
    $('[data-toggle="tooltip-2"]').tooltip();
    $('[data-toggle="tooltip-3"]').tooltip();
    $('[data-toggle="tooltip-4"]').tooltip();
  });
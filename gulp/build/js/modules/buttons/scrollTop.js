// When the user scrolls down 20px from the top of the document, show the button
$('#myBtn').click(function(){
    topFunction();
    console.log('asd');
});

window.onscroll = function() {scrollFunction();};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("myBtn").style.display = "block";
    } else {
        document.getElementById("myBtn").style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $("#hero-section").offset().top
    }, 1300);
}
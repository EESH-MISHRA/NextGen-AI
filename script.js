window.addEventListener('load', function() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(function() {
      preloader.style.opacity = '0'; 
      preloader.addEventListener('transitionend', function() {
        preloader.style.display = 'none'; 
      });
    }, 2000);
  }
});
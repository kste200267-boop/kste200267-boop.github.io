// js/toast.js
function toast(m){var el=document.getElementById('toast');el.textContent=m;el.classList.add('show');setTimeout(function(){el.classList.remove('show')},2500)}

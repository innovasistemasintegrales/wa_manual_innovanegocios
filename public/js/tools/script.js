$(document).ready(main);

var cont = 1;
function main(){
    /* eventos para menu  index*/
    $('#ico_menu').click(function(){
        if(cont ==1){
            $('#menu').animate({left:'0'});
            cont = 0;
        }else{
            cont = 1;
            $('#menu').animate({left:'-100%'});
        }
    });
   
    $('#op_categoria').click(function(){
        if(cont == 0)
        {
            $('#menu').animate({left:'-100%'});
            cont = 1;
        }
    });
    
    $('#op_politica').click(function(){
        if(cont == 0)
        {
            $('#menu').animate({left:'-100%'});
            cont = 1;
        }
    });
 
    $('#op_nosotros').click(function(){
        if(cont == 0)
        {
            $('#menu').animate({left:'-100%'});
            cont = 1;
        }
    });
    /* lisBox Menu */
    $('.menu-todos-movil').click(function(){
        if(cont == 0)
        {
            $('#menu').animate({left:'-100%'});
            cont = 1;
        }
    });
    $('.menu-computadoras-movil').click(function(){
        if(cont == 0)
        {
            $('#menu').animate({left:'-100%'});
            cont = 1;
        }
    });
    $('.menu-impresoras-movil').click(function(){
        if(cont == 0)
        {
            $('#menu').animate({left:'-100%'});
            cont = 1;
        }
    });
    $('.menu-accesorios-movil').click(function(){
        if(cont == 0)
        {
            $('#menu').animate({left:'-100%'});
            cont = 1;
        }
    });
    $('.menu-oferta-movil').click(function(){
        if(cont == 0)
        {
            $('#menu').animate({left:'-100%'});
            cont = 1;
        }
    });

    let boton = document.querySelector("#menuBtn");
    let menu = document.querySelector("#sideMenu");

    boton.addEventListener('click', e=>{
        menu.classList.toggle("menu-expandido");
        menu.classList.toggle("menu-colapsado");

        document.querySelector('body').classList.toggle('body-expandido');
    });
}
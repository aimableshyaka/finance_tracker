const btnSignIn=document.getElementById("btnSignIn");
const btnCreate=document.getElementById("btnCreate");

const signInForm=document.getElementById("signInForm");
const createForm=document.getElementById("createForm");

btnSignIn.onclick=() =>{
    btnSignIn.classList.add("active");
    btnCreate.classList.remove("active");

    signInForm.style.display="block";
    createForm.style.display="none";
};
btnCreate.onclick= () =>{
    btnCreate.classList.add("active");
    btnSignIn.classList.remove("active");

    signInForm.style.display="none";
    createForm.style.display="block";
}
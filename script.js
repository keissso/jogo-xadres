const botao = document.getElementById('botao');
const mensagem = document.getElementById('mensagem');

botao.addEventListener('click', () => {
  mensagem.textContent = 'Mensagem alterada com JavaScript!';
});

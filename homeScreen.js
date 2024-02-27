document.addEventListener('DOMContentLoaded', function() {
  let db;
  const request = window.indexedDB.open('stockDB', 1);

  request.onerror = function(event) {
    console.log('Erro ao abrir o banco de dados:', event.target.errorCode);
  };

  request.onsuccess = function(event) {
    db = event.target.result;
    displayStock();
    changeLanguage(); // Chama a função para mudar o idioma ao carregar a página
  };

  request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('stock', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('name', 'name', { unique: false });
    objectStore.createIndex('quantity', 'quantity', { unique: false });
  };

  const stockForm = document.getElementById('stockForm');
  const stockList = document.getElementById('stockList');
  const searchInput = document.getElementById('searchInput');

  stockForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const itemNameInput = document.getElementById('itemName');
    const itemQuantityInput = document.getElementById('itemQuantity');

    const itemName = itemNameInput.value;
    const itemQuantity = parseInt(itemQuantityInput.value);

    if (itemName && !isNaN(itemQuantity) && itemQuantity > 0) {
      addItemToDB(itemName, itemQuantity);
      itemNameInput.value = '';
      itemQuantityInput.value = '';
    } else {
      alert('Por favor, preencha o nome e a quantidade do item corretamente.');
    }
  });

  searchInput.addEventListener('input', function() {
    displayStock(this.value.trim().toLowerCase()); // Chama a função displayStock com o valor de pesquisa
  });

  function addItemToDB(name, quantity) {
    const transaction = db.transaction(['stock'], 'readwrite');
    const objectStore = transaction.objectStore('stock');
    const newItem = {
      name: name,
      quantity: quantity
    };

    const request = objectStore.add(newItem);

    request.onsuccess = function() {
      displayStock();
    };

    request.onerror = function(event) {
      console.log('Erro ao adicionar item:', event.target.errorCode);
    };
  }

  function displayStock(searchTerm = '') {
    while (stockList.firstChild) {
      stockList.removeChild(stockList.firstChild);
    }

    const objectStore = db.transaction('stock').objectStore('stock');
    objectStore.openCursor().onsuccess = function(event) {
      const cursor = event.target.result;

      if (cursor) {
        // Verifique se o nome do item contém o termo de pesquisa
        if (cursor.value.name.toLowerCase().includes(searchTerm)) {
          const li = document.createElement('li');
          li.textContent = `${cursor.value.name} - ${cursor.value.quantity}`;

          const removeButton = document.createElement('button');
          removeButton.textContent = 'Remover';
          removeButton.dataset.itemId = cursor.key;
          removeButton.addEventListener('click', function() {
            const itemId = parseInt(this.dataset.itemId); // Converte o ID do item para número
            removeItem(itemId);
          });

          const updateButton = document.createElement('button');
          updateButton.textContent = 'Atualizar';
          updateButton.classList.add('small-button'); // Adiciona a classe para tornar o botão menor
          updateButton.dataset.itemId = cursor.key;
          updateButton.addEventListener('click', function() {
            const newQuantity = parseInt(prompt('Digite a nova quantidade:'));
            if (!isNaN(newQuantity) && newQuantity >= 0) {
              const itemId = parseInt(this.dataset.itemId); // Converte o ID do item para número
              updateItemQuantity(itemId, newQuantity);
            } else {
              alert('Digite uma quantidade válida.');
            }
          });

          li.appendChild(removeButton);
          li.appendChild(updateButton); // Adiciona o botão de atualizar ao item da lista
          stockList.appendChild(li);
        }

        cursor.continue();
      }
    };
  }

  function removeItem(id) {
    const transaction = db.transaction(['stock'], 'readwrite');
    const objectStore = transaction.objectStore('stock');
    const request = objectStore.delete(id);

    request.onsuccess = function() {
      displayStock();
    };

    request.onerror = function(event) {
      console.log('Erro ao remover item:', event.target.errorCode);
    };
  }

  // Função para atualizar a quantidade do item
  function updateItemQuantity(id, newQuantity) {
    const transaction = db.transaction(['stock'], 'readwrite');
    const objectStore = transaction.objectStore('stock');
    const request = objectStore.get(id);

    request.onsuccess = function(event) {
      const data = event.target.result;
      if (data) {
        data.quantity = newQuantity;
        const updateRequest = objectStore.put(data);
        updateRequest.onsuccess = function() {
          displayStock(); // Atualiza a lista após a alteração da quantidade
        };
        updateRequest.onerror = function(event) {
          console.log('Erro ao atualizar a quantidade:', event.target.errorCode);
        };
      }
    };

    request.onerror = function(event) {
      console.log('Erro ao buscar o item:', event.target.errorCode);
    };
  }

  // Função para mudar o idioma da interface do usuário
  function changeLanguage() {
    // Detecta o idioma do navegador
    var userLanguage = navigator.language || navigator.userLanguage;

    // Verifica o idioma e atualiza os textos correspondentes na interface do usuário
    if (userLanguage.startsWith('pt')) { // Português
      document.getElementById('title').innerText = 'Controle de Estoque';
      document.getElementById('itemName').setAttribute('placeholder', 'Nome do Item');
      document.getElementById('itemQuantity').setAttribute('placeholder', 'Quantidade');
      document.getElementById('searchInput').setAttribute('placeholder', 'Pesquisar por nome do item');
      // Adicione mais atualizações de texto para o idioma português, se necessário
    } else if (userLanguage.startsWith('en')) { // Inglês
      document.getElementById('title').innerText = 'Stock Control';
      document.getElementById('itemName').setAttribute('placeholder', 'Item Name');
      document.getElementById('itemQuantity').setAttribute('placeholder', 'Quantity');
      document.getElementById('searchInput').setAttribute('placeholder', 'Search by item name');
      // Adicione mais atualizações de texto para o idioma inglês, se necessário
    }
    // Adicione mais condições para outros idiomas, se desejar suportá-los
  }
});
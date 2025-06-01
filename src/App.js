import React, { useState, useEffect } from 'react';

// Helper function to save inventory to local storage
const saveInventoryToLocalStorage = (inventoryData) => {
  try {
    localStorage.setItem('inventory', JSON.stringify(inventoryData));
    console.log("Local storage updated:", inventoryData); // Debug log
  } catch (error) {
    console.error("Error saving to local storage:", error);
    // You might want to display an alert to the user here
  }
};

// Main App Component
const App = () => {
  const [inventory, setInventory] = useState([]);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // This holds the item being edited
  const [editQuantity, setEditQuantity] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); // Stores ID for pending deletion
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [jsonImportText, setJsonImportText] = useState('');

  // Function to show custom alert message
  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertVisible(true);
  };

  // Function to hide custom alert message
  const hideAlert = () => {
    setAlertMessage(''); // Clear message first
    setIsAlertVisible(false);
    setConfirmingDeleteId(null); // Crucial: Clear confirming ID when alert is hidden
  };

  // Data Loading from Local Storage on Mount
  useEffect(() => {
    console.log("App component mounted. Current inventory state (initial):", inventory); // Debug log
    try {
      const storedInventory = localStorage.getItem('inventory');
      if (storedInventory) {
        const parsedInventory = JSON.parse(storedInventory);
        // Ensure old items get isFavorite property if it's missing
        const inventoryWithFavorites = parsedInventory.map(item => ({
          ...item,
          isFavorite: item.hasOwnProperty('isFavorite') ? item.isFavorite : false // Default to false if not present
        }));
        setInventory(inventoryWithFavorites);
        console.log("Inventory loaded from local storage:", inventoryWithFavorites); // Debug log
      } else {
        console.log("No inventory found in local storage."); // Debug log
      }
    } catch (error) {
      console.error("Error loading from local storage:", error);
      showAlert("Failed to load inventory from local storage.");
    }
  }, []); // Empty dependency array means this runs once on component mount

  // Inventory Management Functions (Local Storage Operations)

  const handleAddItem = () => {
    if (!newItemName || !newItemQuantity) {
      showAlert('Please fill all fields.');
      return;
    }

    const quantityNum = parseInt(newItemQuantity, 10);
    if (isNaN(quantityNum) || quantityNum < 0) {
      showAlert('Quantity must be a non-negative number.');
      return;
    }

    const newItem = {
      id: Date.now().toString(), // Simple unique ID for local storage
      name: newItemName,
      quantity: quantityNum,
      isFavorite: false, // New items are not favorited by default
    };

    const updatedInventory = [...inventory, newItem];
    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory); // Save to local storage

    setAddModalVisible(false);
    setNewItemName('');
    setNewItemQuantity('');
    showAlert('Item added successfully!');
  };

  const handleUpdateQuantity = (id, delta) => {
    const updatedInventory = inventory.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    );
    
    const currentItem = inventory.find(item => item.id === id);
    if (currentItem && (currentItem.quantity + delta) < 0) {
        showAlert('Quantity cannot be negative.');
        return;
    }

    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory);
  };

  // Initiates the deletion confirmation via custom alert
  const handleDeleteItem = (id) => {
    console.log("handleDeleteItem called. ID received for confirmation:", id); // Debug log
    if (!id) {
      console.error("handleDeleteItem: ID is undefined or null, cannot initiate deletion."); // Debug log
      showAlert("Cannot delete item: ID is missing.");
      return;
    }
    setConfirmingDeleteId(id); // Store ID for confirmation
    // Ensure editingItem is valid for displaying name in alert
    const itemToDeleteName = editingItem && editingItem.id === id ? editingItem.name : 'this item';
    showAlert(`Are you sure you want to delete "${itemToDeleteName}"? This action cannot be undone.`);
  };

  // Executes deletion after user confirms via custom alert
  const handleConfirmDeletion = () => {
    const idToDelete = confirmingDeleteId; // Get the ID from state
    console.log("handleConfirmDeletion called. ID to delete:", idToDelete); // Debug log

    if (!idToDelete) {
      console.error("handleConfirmDeletion: No item ID found in confirmingDeleteId state.");
      hideAlert(); // Just hide the alert if no ID is set
      return;
    }

    try {
      const updatedInventory = inventory.filter(item => item.id !== idToDelete);
      console.log("Inventory before set (after filter):", updatedInventory); // Debug log
      setInventory(updatedInventory); // Update React state
      saveInventoryToLocalStorage(updatedInventory); // Persist to local storage
      
      setEditModalVisible(false); // Close edit modal
      setEditingItem(null); // Clear editing item state
      hideAlert(); // Hide the confirmation alert
      showAlert('Item deleted successfully!');
      console.log("Item deletion process completed successfully for ID:", idToDelete); // Debug log
    } catch (error) {
      console.error("Error during deletion process:", error); // Debug log
      showAlert('Failed to delete item.');
    }
  };

  // Function to toggle favorite status
  const toggleFavorite = (id) => {
    console.log("Toggling favorite for item ID:", id); // Debug log
    const updatedInventory = inventory.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory);
  };


  const openEditModal = (item) => {
    console.log("openEditModal called for item:", item); // Debug log
    if (!item || !item.id) {
      console.error("openEditModal: Item or item ID is missing, cannot open modal."); // Debug log
      showAlert("Cannot edit item: Item data is incomplete.");
      return;
    }
    setEditingItem(item); // Set the item being edited
    setEditQuantity(String(item.quantity));
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) {
      console.error("handleSaveEdit: No editing item found.");
      return;
    }

    const newQuantity = parseInt(editQuantity, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      showAlert('Quantity must be a non-negative number.');
      return;
    }

    const updatedInventory = inventory.map(item =>
      item.id === editingItem.id ? { ...item, quantity: newQuantity } : item
    );
    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory);

    setEditModalVisible(false);
    setEditingItem(null);
    showAlert('Item updated successfully!');
  };

  // JSON Import/Export Functions (Local Storage Specific)

  const handleImportJson = () => {
    try {
      const parsedData = JSON.parse(jsonImportText);
      if (!Array.isArray(parsedData)) {
        showAlert('Invalid JSON format. Expected an array of items.');
        return;
      }

      const confirmClear = window.confirm('Do you want to clear existing inventory before importing?');
      let finalInventory = [];

      if (!confirmClear) {
        finalInventory = [...inventory];
        parsedData.forEach(newItem => {
            const existingIndex = finalInventory.findIndex(item => item.name === newItem.name);
            if (existingIndex > -1) {
                finalInventory[existingIndex] = {
                    ...finalInventory[existingIndex],
                    quantity: newItem.quantity,
                    isFavorite: newItem.hasOwnProperty('isFavorite') ? newItem.isFavorite : false // Preserve or default
                };
            } else {
                finalInventory.push({
                    id: newItem.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
                    name: newItem.name,
                    quantity: newItem.quantity,
                    isFavorite: newItem.hasOwnProperty('isFavorite') ? newItem.isFavorite : false // Preserve or default
                });
            }
        });

      } else {
        finalInventory = parsedData.map(item => ({
          id: item.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: item.name,
          quantity: item.quantity,
          isFavorite: item.hasOwnProperty('isFavorite') ? item.isFavorite : false // Preserve or default
        }));
      }
      
      setInventory(finalInventory);
      saveInventoryToLocalStorage(finalInventory);

      setIsImportModalVisible(false);
      setJsonImportText('');
      showAlert('Inventory imported successfully!');

    } catch (error) {
      console.error('Error importing JSON:', error);
      showAlert('Failed to import JSON. Please check the format and ensure it\'s a valid array of objects.');
    }
  };

  const handleExportJson = () => {
    try {
      // Ensure isFavorite is included in export
      const jsonString = JSON.stringify(inventory.map(({ id, name, quantity, isFavorite }) => ({ name, quantity, isFavorite })), null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showAlert('Inventory exported successfully!');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      showAlert('Failed to export JSON.');
    }
  };

  // Sort inventory: favorites first, then by name
  const sortedInventory = [...inventory].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1; // a comes before b if a is favorite and b is not
    if (!a.isFavorite && b.isFavorite) return 1;  // b comes before a if b is favorite and a is not
    return a.name.localeCompare(b.name); // Otherwise, sort alphabetically by name
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Tailwind CSS CDN and custom styles are assumed to be in public/index.html */}

      <header className="p-4 bg-white border-b border-gray-200 shadow-sm flex justify-center items-center relative">
        <h1 className="text-2xl font-bold text-gray-900">My Local Inventory</h1>
      </header>

      <div className="flex-1 p-4 overflow-y-auto pb-24">
        {/* --- GRID LAYOUT FOR TILES STARTS HERE --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.length === 0 ? (
            null
          ) : (
            sortedInventory.map(item => ( // Use sortedInventory here
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 shadow-md flex flex-col justify-between cursor-pointer hover:shadow-lg transition duration-200 ease-in-out relative" // Added relative for absolute positioning of star
              >
                {/* Star Icon for Favorite */}
                <button
                  className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 bg-opacity-70 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 z-10"
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} // Stop propagation
                  aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {item.isFavorite ? (
                    // Filled star (yellow)
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                    </svg>
                  ) : (
                    // Outlined star (gray)
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                    </svg>
                  )}
                </button>

                {/* Apply onDoubleClick to this specific div to prevent button interference */}
                <div className="flex flex-col flex-grow justify-center" onDoubleClick={() => openEditModal(item)}>
                  <div className="flex flex-col sm:flex-row justify-between items-center sm:items-baseline gap-x-4 mb-1">
                    <p className="text-xl sm:text-2xl font-bold text-indigo-700 text-center sm:text-left flex-1">{item.name}</p>
                    <p className="text-lg sm:text-xl text-indigo-600 text-center sm:text-right">Qty: <span className="font-semibold">{item.quantity}</span></p>
                  </div>
                </div>

                <div className="flex w-full mt-auto"> {/* Changed: Added w-full, removed gap-2, justify classes not needed with flex-1 */}
                  <button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg shadow-md transition duration-200 ease-in-out"
                    onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.id, 1); }}
                  >
                    +
                  </button>
                  <button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg text-lg shadow-md transition duration-200 ease-in-out"
                    onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.id, -1); }}
                  >
                    -
                  </button>
                </div>
              </div>
            ))
          )}

          {/* ADD NEW ITEM TILE - ALWAYS LAST IN THE GRID */}
          <button
            className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center justify-center text-gray-400 hover:text-green-500 hover:border-green-500 border-2 border-dashed transition duration-200 ease-in-out cursor-pointer"
            style={{ minHeight: '150px' }} // Ensure consistent height with other tiles
            onClick={() => setAddModalVisible(true)}
          >
            <span className="text-6xl font-light mb-2">+</span>
            <span className="text-lg font-semibold">Add New Item</span>
          </button>
          {/* END ADD NEW ITEM TILE */}
        </div>
        {/* --- GRID LAYOUT FOR TILES ENDS HERE --- */}

        {inventory.length === 0 && (
          <p className="text-center mt-12 text-lg text-gray-500">No items in inventory. Click the '+' tile to add some!</p>
        )}
      </div>

      {/* Moved global action buttons to be consistent with the new tile layout */}
      <div className="fixed bottom-6 left-6 right-6 flex flex-col sm:flex-row gap-3">
        <button
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition duration-200 ease-in-out z-10"
          onClick={() => setIsImportModalVisible(true)}
        >
          Load JSON
        </button>
        <button
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition duration-200 ease-in-out z-10"
          onClick={handleExportJson}
        >
          Share JSON
        </button>
      </div>


      {/* Add New Item Modal */}
      {isAddModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">Add New Inventory Item</h2>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <input
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Quantity"
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
            />
            <div className="flex justify-around gap-4">
              <button
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={() => setAddModalVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={handleAddItem}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">Edit Item Quantity</h2>
            {editingItem && (
              <p className="text-lg mb-4 text-gray-700 text-center">Item: <span className="font-semibold">{editingItem.name}</span></p>
            )}
            <input
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New Quantity"
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
            />
            <div className="flex justify-around gap-4 mt-6">
              <button
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={() => setEditModalVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
            <button
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out mt-4"
              onClick={() => handleDeleteItem(editingItem.id)}
            >
              Delete Item
            </button>
          </div>
        </div>
      )}

      {/* Custom Alert Modal - Now also used for Delete Confirmation */}
      {isAlertVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Notification</h3>
            <p className="text-gray-700 mb-6">{alertMessage}</p>
            {confirmingDeleteId ? (
              <div className="flex justify-around gap-4">
                <button
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                  onClick={hideAlert}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                  onClick={handleConfirmDeletion}
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={hideAlert}
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

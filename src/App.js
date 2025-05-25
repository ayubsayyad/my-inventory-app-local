import React, { useState, useEffect } from 'react';

// Helper function to save inventory to local storage
const saveInventoryToLocalStorage = (inventoryData) => {
  try {
    localStorage.setItem('inventory', JSON.stringify(inventoryData));
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
  const [newItemLocation, setNewItemLocation] = useState('');
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [jsonImportText, setJsonImportText] = useState('');

  // Function to show custom alert message
  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertVisible(true);
  };

  // Function to hide custom alert message
  const hideAlert = () => {
    setIsAlertVisible(false);
    setAlertMessage('');
  };

  // Data Loading from Local Storage on Mount
  useEffect(() => {
    try {
      const storedInventory = localStorage.getItem('inventory');
      if (storedInventory) {
        setInventory(JSON.parse(storedInventory));
      }
    } catch (error) {
      console.error("Error loading from local storage:", error);
      showAlert("Failed to load inventory from local storage.");
    }
  }, []); // Empty dependency array means this runs once on component mount

  // Inventory Management Functions (Local Storage Operations)

  const handleAddItem = () => {
    if (!newItemName || !newItemQuantity || !newItemLocation) {
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
      location: newItemLocation,
    };

    const updatedInventory = [...inventory, newItem];
    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory); // Save to local storage

    setAddModalVisible(false);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemLocation('');
    showAlert('Item added successfully!');
  };

  const handleUpdateQuantity = (id, delta) => {
    const currentItem = inventory.find(item => item.id === id);
    if (!currentItem) return;

    const newQuantity = currentItem.quantity + delta;
    if (newQuantity < 0) {
      showAlert('Quantity cannot be negative.');
      return;
    }

    const updatedInventory = inventory.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    
    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory); // Save to local storage
    showAlert('Quantity updated!');
  };

  const handleDeleteItem = (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this item?');
    if (!confirmDelete) {
      return;
    }

    const updatedInventory = inventory.filter(item => item.id !== id);
    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory); // Save to local storage
    showAlert('Item deleted successfully!');
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditQuantity(String(item.quantity));
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    const newQuantity = parseInt(editQuantity, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      showAlert('Quantity must be a non-negative number.');
      return;
    }

    const updatedInventory = inventory.map(item =>
      item.id === editingItem.id ? { ...item, quantity: newQuantity } : item
    );
    setInventory(updatedInventory);
    saveInventoryToLocalStorage(updatedInventory); // Save to local storage

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
        // Simple merge: add new items. Existing items with same name will be duplicates.
        // For a more robust merge, you'd need to compare and update based on unique identifiers.
        finalInventory = [...inventory]; // Start with existing
        parsedData.forEach(newItem => {
            // Check if an item with the same name already exists and update it, or add as new
            const existingIndex = finalInventory.findIndex(item => item.name === newItem.name);
            if (existingIndex > -1) {
                // Update existing item (e.g., quantity)
                finalInventory[existingIndex] = {
                    ...finalInventory[existingIndex],
                    quantity: newItem.quantity,
                    location: newItem.location || finalInventory[existingIndex].location // Update location if provided
                };
            } else {
                // Add new item, ensuring it has an ID
                finalInventory.push({
                    id: newItem.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
                    name: newItem.name,
                    quantity: newItem.quantity,
                    location: newItem.location
                });
            }
        });

      } else {
        // If clearing, just use the parsed data
        finalInventory = parsedData.map(item => ({
          id: item.id || Date.now().toString() + Math.random().toString(36).substring(2, 9), // Generate if missing
          name: item.name,
          quantity: item.quantity,
          location: item.location
        }));
      }
      
      setInventory(finalInventory);
      saveInventoryToLocalStorage(finalInventory); // Save the imported data

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
      const jsonString = JSON.stringify(inventory, null, 2); // Pretty print JSON
      // Create a Blob and a URL to trigger download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url); // Clean up
      showAlert('Inventory exported successfully!');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      showAlert('Failed to export JSON.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Tailwind CSS CDN and custom styles are assumed to be in public/index.html */}

      <header className="p-4 bg-white border-b border-gray-200 shadow-sm flex justify-center items-center relative">
        <h1 className="text-2xl font-bold text-gray-900">My Local Inventory</h1>
      </header>

      <div className="flex-1 p-4 overflow-y-auto pb-24">
        {inventory.length === 0 ? (
          <p className="text-center mt-12 text-lg text-gray-500">No items in inventory. Add some!</p>
        ) : (
          // --- TABLE STRUCTURE STARTS HERE ---
          <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200"> {/* Added wrapper for responsive scrolling and outer border */}
            <table className="min-w-full bg-white divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600">
                      <span className="font-semibold">{item.quantity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2"> {/* Centered buttons */}
                        <button
                          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-3 rounded-lg text-xs shadow-sm transition duration-200 ease-in-out"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                        >
                          +
                        </button>
                        <button
                          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-3 rounded-lg text-xs shadow-sm transition duration-200 ease-in-out"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                        >
                          -
                        </button>
                        <button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-lg text-xs shadow-sm transition duration-200 ease-in-out"
                          onClick={() => openEditModal(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg text-xs shadow-sm transition duration-200 ease-in-out"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          // --- TABLE STRUCTURE ENDS HERE ---
        )}
      </div>

      <div className="fixed bottom-6 left-6 right-6 flex flex-col sm:flex-row gap-3">
        <button
          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition duration-200 ease-in-out z-10"
          onClick={() => setAddModalVisible(true)}
        >
          Add New Item
        </button>
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
            <input
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Location"
              value={newItemLocation}
              onChange={(e) => setNewItemLocation(e.target.value)}
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
            <div className="flex justify-around gap-4">
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
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {isImportModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">Import Inventory from JSON</h2>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-base text-gray-900 h-40 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste JSON array here, e.g., [{&quot;name&quot;:&quot;Item A&quot;,&quot;quantity&quot;:10,&quot;location&quot;:&quot;Shelf 1&quot;}]"
              value={jsonImportText}
              onChange={(e) => setJsonImportText(e.target.value)}
            ></textarea>
            <div className="flex justify-around gap-4">
              <button
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={() => setIsImportModalVisible(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md transition duration-200 ease-in-out"
                onClick={handleImportJson}
              >
                Import Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {isAlertVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30 p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Notification</h3>
            <p className="text-gray-700 mb-6">{alertMessage}</p>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition duration-200 ease-in-out"
              onClick={hideAlert}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
// components/transaction-form.tsx - el formulario que el usuario llena, envia los datos a la api
'use client'; // al ser un componente interactivo, 'use client'

import { useState } from 'react';

export const TransactionForm = () => { // componente para el formulario
  // Estados para cada campo del formulario
  const [userId, setUserId] = useState('user-123'); // estado para el id del usuario
  const [fromAccount, setFromAccount] = useState('ACC-001'); // estado para la cuenta de origen
  const [toAccount, setToAccount] = useState('ACC-002'); // estado para la cuenta de destino
  const [amount, setAmount] = useState('100.00'); // estado para el monto
  const [currency, setCurrency] = useState('USD'); // estado para la moneda
  const [isLoading, setIsLoading] = useState(false); // estado para el loading
  const [message, setMessage] = useState<string | null>(null); // estado para el mensaje

  const handleSubmit = async (e: React.FormEvent) => { // funcion que se ejecuta cuando se envia el formulario
    e.preventDefault(); // evita que se recargue la pagina
    setIsLoading(true); // muestra el loading
    setMessage(null); // limpia el mensaje

    try {
      // Aca es donde se llama a la API
      const response = await fetch('/api/transactions', { // envia los datos al backend
        method: 'POST', // metodo para enviar los datos
        headers: { // headers para enviar los datos
          'Content-Type': 'application/json', // tipo de contenido
        },
        body: JSON.stringify({ // envia los datos al backend
          userId, // id del usuario
          fromAccount, // cuenta de origen
          toAccount, // cuenta de destino
          amount: parseFloat(amount), // monto
          currency, // moneda
        }),
      });

      const data = await response.json(); // recibe la respuesta del backend

      if (!response.ok) { // si la respuesta no es ok, lanza un error
        throw new Error(data.error || 'Falló al iniciar la transacción');
      }

      // Si sale bien, mostramos el ID de la transacción
      setMessage(`Transacción iniciada: ${data.transactionId}`);
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally { // finalmente, oculta el loading
      setIsLoading(false); // oculta el loading
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-white">New Transaction</h2>
      <p className="text-gray-400 mb-6">Initiate a new banking transaction.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-300">
              User ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-300">
              Currency
            </label>
            <input
              type="text"
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="fromAccount" className="block text-sm font-medium text-gray-300">
            From Account
          </label>
          <input
            type="text"
            id="fromAccount"
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="toAccount" className="block text-sm font-medium text-gray-300">
            To Account
          </label>
          <input
            type="text"
            id="toAccount"
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Initiate Transaction'}
          </button>
        </div>
      </form>
      
      {message && (
        <p className={`mt-4 text-sm ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
};
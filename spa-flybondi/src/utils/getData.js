const getData = async () => {
    try {
      const response = await fetch("dataset.json"); // busca en public/
    const data = await response.json();
    return data;
    } catch (error) {
    console.error("Error cargando dataset:", error);
    return [];
    }
};

export default getData;

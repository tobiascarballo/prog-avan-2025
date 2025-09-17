const API = 'https://api.spacexdata.com/v5/launches';

const getData = async (id) => {
    try {
        const apiURL = id ? `${API}/${id}` : API;
        const response = await fetch(apiURL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
    }
};

export default getData;
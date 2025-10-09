async function get(url: string): Promise<Response> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response;
    } catch (error) {
        const iri = `/api/get/?url=${url}`;
        console.error(`error no cliente get: ${iri}`, error);
        const fallbackResponse = await fetch(iri);
        console.log(`Chamando proxy para ${iri}`);
        return  fallbackResponse;
    }
}

// Exporta as funções para uso em outros módulos
export {get };
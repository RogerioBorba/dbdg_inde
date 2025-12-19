<script lang="ts">
    import {get} from '$lib/request';
    let title = $state('');
    function query() {
      let s: string = `https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetRecords&resultType=results&elementSetName=full&constraintLanguage=CQL_TEXT&constraint_language_version=1.1.0&constraint=AnyText+LIKE+'%25Atlas+de+Saneamento%25'`
    }
    function consultar() {
        // Lógica para consultar pelo título
        console.log(`Consultando pelo título: ${title}`);
        //https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetRecords&resultType=results&elementSetName=full&constraintLanguage=CQL_TEXT&constraint_language_version=1.1.0&constraint=AnyText+LIKE+'%25Atlas+de+Saneamento%25'
    }   
</script>
<p>Busca pelo título</p>
<input
  type="text"
  bind:value={title}
  placeholder="Digite o título para buscar"
  class="border p-2 rounded w-full mb-4" />
<button  class="bg-blue-500 text-white px-4 py-2 rounded" onclick={consultar}>Consultar
</button>

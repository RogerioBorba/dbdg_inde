// place files you want to import through the `$lib` alias in this folder.
// Esta interface segue a estrutura dos itens da API: https://inde.gov.br/api/catalogo/get
export type IGeoservicoDescricao = { 
    descricao: string, 
    url: string;
    nivel_no: string, 
    wcsAvalaible: boolean, 
    wcsGetCapabilities: string, 
    wfsAvalaible: boolean,
    wfsGetCapabilities: string, 
    wmsAvalaible: boolean,
    wmsGetCapabilities: string, 
    cswAvalaible: boolean,
    cswGetCapabilities: string, 
 };

 export type ICatalogoCSW = {
    descricao: string;
    sigla: string;
    url: string;
    cswGetCapabilities: string;
    noCentralCategoria: string | null;
 };

 export const catalogos_csw = [
        {
            "descricao": "ANA - Agência Nacional de Águas e Saneamento Básico",
            "sigla": "ANA",
            "url": "https://metadados.snirh.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.snirh.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "ANATEL - Agência Nacional de Telecomunicações",
            "sigla": "ANATEL",
            "url": "https://sistemas.anatel.gov.br/geonetwork",
            "cswGetCapabilities": "https://sistemas.anatel.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "ANM - Agência Nacional de Mineração",
            "sigla": "ANM",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "ANM"
        },
        {
            "descricao": "ANP - Agência Nacional do Petróleo, Gás Natural e Biocombustíveis",
            "sigla": "ANP",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "ANP"
        },
        {
            "descricao": "BNDES - Banco Nacional de Desenvolvimento Econômico e Social ",
            "sigla": "BNDES",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "BNDES"
        },
        {
            "descricao": "CENSIPAM - Centro Gestor e Operacional do Sistema de Proteção da Amazônia",  
            "sigla": "CENSIPAM",
            "url": "https://panorama.sipam.gov.br/geonetwork/",
            "cswGetCapabilities": "https://panorama.sipam.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "CPRM - Serviço Geológico do Brasil",
            "sigla": "CPRM",
            "url": "https://geoservicos.sgb.gov.br/geonetwork",
            "cswGetCapabilities": "https://geoservicos.sgb.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "DNIT - Departamento Nacional de Infraestrutura de Transportes",
            "sigla": "DNIT",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "DNIT"
        },
        {
            "descricao": "DHN - Diretoria de Hidrografia e Navegação da Marinha do Brasil",  
            "sigla": "MB/DHN",
            "url": "https://idem.dhn.mar.mil.br/geonetwork",
            "cswGetCapabilities": "https://idem.dhn.mar.mil.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "DPC- Diretoria de Portos e Costas da Marinha",
            "sigla": "MB/DPC",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "DPC"
        },
        {
            "descricao": "DPHDM - Diretoria do Patrimônio Histórico e Documentação da Marinha",
            "sigla": "MB/DPHDM",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "DPHDM"
        },
        {
            "descricao": "EB/DSG - Diretoria de Serviço Geográfico do Exército Brasileiro",  
            "sigla": "EBDSG",
            "url": "https://bdgex.eb.mil.br/bdgexapp",
            "cswGetCapabilities": "https://bdgex.eb.mil.br/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "EPE - Empresa de Pesquisa Energética",
            "sigla": "EPE",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "EPE"
        },
        {
            "descricao": "EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária",  
            "sigla": "EMBRAPA",
            "url": "https://geoinfo.dados.embrapa.br/metadados",
            "cswGetCapabilities": "https://geoinfo.dados.embrapa.br/metadados/srv/por/csw?request=GetCapabilities&service=CSW&version=2.0.2",
            "noCentralCategoria": null
        },
        {
            "descricao": "Engenharia, Construções e Ferrovias S.A",
            "sigla": "VALEC",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "VALEC"
        },
        {
            "descricao": "IBAMA - Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis ",
            "sigla": "IBAMA",
            "url": "http://siscom.ibama.gov.br/geonetwork/",
            "cswGetCapabilities": "http://siscom.ibama.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "IBGE - Instituto Brasileiro de Geografia e Estatística ",
            "sigla": "IBGE",
            "url": "https://metadadosgeo.ibge.gov.br",
            "cswGetCapabilities": "https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "ICA - Instituto de Cartografia Aeronáutica ",
            "sigla": "ICA",
            "url": "https://metadados.inde.gov.br/geonetwork/srv/por/q?category=ICA",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "ICA"
        },
        {
            "descricao": "ICMBIO - Instituto Chico Mendes de Conservação da Biodiversidade",
            "sigla": "ICMBio",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "ICMBio"
        },
        {
            "descricao": "INPE - Instituto Nacional de Pesquisas Espaciais",  
            "sigla": "INPE",
            "url": "http://terrabrasilis.dpi.inpe.br/geonetwork/",
            "cswGetCapabilities": "http://terrabrasilis.dpi.inpe.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "MDA - Ministério do Desenvolvimento Agrário",  
            "sigla": "MDA",
            "url": "http://mapas.mda.gov.br/geonetwork",
            "cswGetCapabilities": "http://mapas.mda.gov.br/geonetwork/srv/pt/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "MDS - Ministério do Desenvolvimento Social e Combate à Fome",  
            "sigla": "MDS",
            "url": "http://mapas.mma.gov.br/geonetwork",
            "cswGetCapabilities": "http://mapas.mma.gov.br/geonetwork/srv/br/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "MDS"
        },
        {
            "descricao": "MINFRA - Ministério da Infraestrutura",
            "sigla": "MINFRA",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "MInfra"
        },
        {
            "descricao": "MS - Ministério da Saúde",  
            "sigla": "MS",
            "url": "http://mapas.sage.saude.gov.br/geonetwork",
            "cswGetCapabilities": "http://mapas.sage.saude.gov.br/geonetwork/srv/br/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "MMA - Minstério do Meio Ambiente",  
            "sigla": "MMA",
            "url": "http://mapas.mma.gov.br/geonetwork",
            "cswGetCapabilities": "http://mapas.mma.gov.br/geonetwork/srv/br/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "MP - Ministério de Planejamento, Desenvolvimento e Gestão ",
            "sigla": "MP",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "MPOG"
        },
        {
            "descricao": "PGGM - Programa de Geologia e Geofísica Marinha",
            "sigla": "PGGM",
            "url_metadados": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "PGGM"
        },
        {
            "descricao": "SPM - Secretaria Nacional de Políticas para as Mulheres",
            "sigla": "SPM",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "SPM"
        },
        {
            "descricao": "UFABC/SP - Universidade Federal do ABC",
            "sigla": "UFABC",            
            "url_metadados": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "UFABC"
        },
        {
            "descricao": "UNB - Fundação Universidade de Brasília / Instituto de Geociências",
            "sigla": "UNB",            
            "url_metadados": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "CEAGUNB"
        },
        {
            "descricao": "UNILA - Universidade Federal da Integração Latino-Americana",
            "sigla": "UNILA",            
            "url_metadados": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "UNILA"
        },
        {
            "descricao": "Fundação João Pinheiro (MG)",
            "sigla": "FJP",
            "url": "https://geonetwork.fjp.mg.gov.br",
            "cswGetCapabilities": "https://geonetwork.fjp.mg.gov.br/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "SEMA/DF - Secretaria de Estado do Meio Ambiente do Distrito Federal",
            "sigla": "SEMADF",
            "url": "https://metadados.sisdia.df.gov.br/geonetwork/",
            "cswGetCapabilities": "https://metadados.sisdia.df.gov.br/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "IDE/DF - Infraestrutura de Dados Espaciais do Distrito Federal",
            "sigla": "IDE/DF",
            "url": "https://www.metadados.seduh.df.gov.br/geonetwork",
            "cswGetCapabilities": "https://www.metadados.seduh.df.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        
        {
            "descricao": "IDE/BA - Infraestrutura de Dados Espaciais da Bahia",  
            "sigla": "IDEBA",
            "url": "https://metadados.ide.ba.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.ide.ba.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "IDE/ES-GEOBASES - Sistema Integrado de Bases Geoespaciais do Estado do Espírito Santo",  
            "sigla": "IDEES",
            "url": "https://ide.geobases.es.gov.br/",
            "cswGetCapabilities": "https://ide.geobases.es.gov.br/catalogue/csw?service=CSW&request=GetCapabilities&version=2.0.2",
            "noCentralCategoria": null
        },
        {
            "descricao": "IEDE/RS - Infraestrutura Estadual de Dados Espaciais do Rio Grande do Sul",
            "sigla": "IEDERS",
            "url": "https://iede.rs.gov.br/geoportal",
            "cswGetCapabilities": "https://iede.rs.gov.br/geoportal/csw?service=CSW&version=2.0.2&request=GetCapabilities"
        },
        {
            "descricao": "IDE/Sisema - Sistema Estadual de Meio Ambiente e Recursos Hídricos (MG)",  
            "sigla": "IDESisema",
            "url": "https://idesisema.meioambiente.mg.gov.br/geonetwork",
            "cswGetCapabilities": "https://idesisema.meioambiente.mg.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "IDE/SP - Infraestrutura de Dados Espaciais de São Paulo",  
            "sigla": "IDESP",
            "url": "http://www.metadados.idesp.sp.gov.br/",
            "cswGetCapabilities": "http://www.metadados.idesp.sp.gov.br/catalogo/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "INEA/RJ - Instituto Estadual do Ambiente",
            "sigla": "INEA",
            "url_metadados": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "INEA"
        },
        
        {
            "descricao": "PRODEMG - Companhia de Tecnologia da Informação do Estado de Minas Gerais",
            "sigla": "PRODEMG",
            "url": "https://www.geoservicos.prodemge.gov.br/geonetwork",
            "cswGetCapabilities": "https://www.geoservicos.prodemge.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "SEMACE/CE - Superintendência Estadual do Meio Ambiente do Ceará",
            "sigla": "SEMACECE",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "SEMACECE"
        },
        {
            "descricao": "SEPLAG/AL - Secretaria de Estado do Planejamento, Gestão e Patrimônio de Alagoas",  
            "sigla": "SEPLAGAL",
            "url": "http://inde.dados.al.gov.br:8080/geonetwork",
            "cswGetCapabilities": "http://inde.dados.al.gov.br:8080/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "TCERO - Tribunal de Contas do Estado de Rondônia",  
            "sigla": "TCERO",
            "url": "https://geonetwork.tcero.tc.br",
            "cswGetCapabilities": "https://geonetwork.tcero.tc.br/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "Prefeitura de Belo Horizante",  
            "sigla": "PrefeituraBH",
            "url": "http://geonetwork.pbh.gov.br/geonetwork/",
            "cswGetCapabilities": "http://geonetwork.pbh.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "Prefeitura de Juazeiro do Norte (CE)",
            "sigla": "PJN",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "CEPJuazeiroNorte"
        },  
        {
            "descricao": "Prefeitura do Município de São Paulo (SP)",
            "sigla": "PSP",
            "url": "https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },

        {
            "descricao": "SEFIN - Secretaria Municipal das Finanças de Fortaleza",  
            "sigla": "SEFIN",
            "url": "https://geonetwork.sefin.fortaleza.ce.gov.br/geonetwork/",
            "cswGetCapabilities": "https://geonetwork.sefin.fortaleza.ce.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": null
        },
        {
            "descricao": "SEFAZ - Secretaria Municipal da Fazenda de Salvador",
            "sigla": "SEFAZ",
            "url": "https://metadados.inde.gov.br/geonetwork",
            "cswGetCapabilities": "https://metadados.inde.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
            "noCentralCategoria": "BAPSalvador"
        },
    ]
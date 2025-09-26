const fetch = require('node-fetch');

const getSoilData = async (lat, lon) => {
    try {
       
        const xmlRequestBody = `
        <wps:Execute xmlns:wps="https://www.opengis.net/wps/1.0.0" 
            xmlns:ows="https://www.opengis.net/ows/1.1" 
            xmlns:xlink="https://www.w3.org/1999/xlink" 
            xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" 
            service="WPS" 
            version="1.0.0">
            <ows:Identifier>gs:SoilWPS</ows:Identifier>
            <wps:DataInputs>
                <wps:Input>
                    <ows:Identifier>lat</ows:Identifier>
                    <wps:Data>
                        <wps:LiteralData>${lat}</wps:LiteralData>
                    </wps:Data>
                </wps:Input>
                <wps:Input>
                    <ows:Identifier>lon</ows:Identifier>
                    <wps:Data>
                        <wps:LiteralData>${lon}</wps:Data>
                    </wps:Data>
                </wps:Input>
            </wps:DataInputs>
            <wps:ResponseForm>
                <wps:RawDataOutput mimeType="application/json">
                    <ows:Identifier>result</ows:Identifier>
                </wps:RawDataOutput>
            </wps:ResponseForm>
        </wps:Execute>
        `;

        const response = await fetch('https://bhuvan-wps.nrsc.gov.in/bhuvan/wps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
            },
            body: xmlRequestBody
        });

        if (!response.ok) {
            console.error("Bhuvan Soil API request failed with status:", response.status);
            return null;
        }

        const data = await response.json();
        
       
        if (data && data.Soil_Data) {
            const soilInfo = data.Soil_Data[0];
            return {
                soil_type: soilInfo.SOIL_TYPE || 'Not available',
                texture: soilInfo.TEXTURAL_C || 'Not available',
                depth: soilInfo.SOIL_DEPTH || 'Not available',
                ph: soilInfo.SOIL_PH || 'Not available',
                organic_carbon: soilInfo.ORGANIC_CA || 'Not available',
                last_updated: new Date()
            };
        } else {
            console.log("Bhuvan API responded, but no soil data found for this location.");
            return null;
        }

    } catch (error) {
        console.error("Critical error in soilService:", error);
        return null;
    }
};

module.exports = { getSoilData };
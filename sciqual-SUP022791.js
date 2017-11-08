// We assume that we're logged on before we do anything in here
var myJquery = require('./myJquery');

module.exports =
{
	data: {},

	formatXHTML: function(sValue, bDirection)
	{
		var aFind = [
			String.fromCharCode(8220), //“
			String.fromCharCode(8221), //”
			String.fromCharCode(8216), //‘
			String.fromCharCode(8217), //‘
			String.fromCharCode(8211), //–
			String.fromCharCode(8212), //—
			String.fromCharCode(189), //½
			String.fromCharCode(188), //¼
			String.fromCharCode(190), //¾
			String.fromCharCode(169), //©
			String.fromCharCode(174), //®
			String.fromCharCode(8230) //…  
		];	

		var aReplace = [
			'"',
			'"',
			"'",
			"'",
			"-",
			"--",
			"1/2",
			"1/4",
			"3/4",
			"(C)",
			"(R)",
			"..."
		];

		if (sValue)
		{
			if(bDirection)
			{
				sValue= sValue.replace(/\&/g,'&amp;');
				sValue= sValue.replace(/</g,'&lt;');
				sValue= sValue.replace(/>/g,'&gt;');
				//sValue = sValue.replace(/-/g, '&#45;')
				//sValue = sValue.replace(/@/g, '&#64;')
				//sValue = sValue.replace(/\//g, '&#47;')
				//sValue = sValue.replace(/"/g, '&quot;')
				//sValue = sValue.replace(/\\/g, '&#39;')
			}
			else
			{
				sValue = sValue.replace(/\&amp;/g,'&');
				sValue = sValue.replace(/\&lt;/g,'<');
				sValue = sValue.replace(/\&gt;/g,'>');
				sValue = sValue.replace(/\&#45;/g, '-');
				sValue = sValue.replace(/\&#64;/g, '@');
				sValue = sValue.replace(/\&#47;/g, '/');
				sValue = sValue.replace(/\&quot;/g, '"');
				sValue = sValue.replace(/\&#39;/g, '\'');
				sValue = sValue.replace(/\&#239;‚&#167;,&#226;/g, '-');
				for ( var i = 0; i < aFind.length; i++ ) 
				{
					var regex = new RegExp(aFind[i], "gi");
					sValue = sValue.replace(regex, aReplace[i]);
				}
			}
		}

		return sValue;	
	},

	sendLogFile: function(oParam)
	{
		var sciqual = module.exports;
		var bLocal = (oParam.settings.local != undefined) ? oParam.settings.local == "true" : false;
		var sHTML = '<p>' + oParam.logHTML.join('<br />') + '</p>';
		var sEmailData = 'to=' + encodeURIComponent(oParam.settings.email) +
					 '&subject=' + encodeURIComponent((oParam.errorOccurred == true || oParam.errorMinor === true ? 'ERROR ': '') + 
					 				(oParam.errorMinor === true ? (oParam.errorOccurred === true ? ':Minor ' : 'Minor Error ') : '') + 
					 				'Log File for ANZSIC Code Update') +
					 '&fromemail=' + encodeURIComponent('cassandra.buono@alt-designit.com.au') +
					 '&message=' + encodeURIComponent(sHTML) +
					 '&send=Y';

		oParam.ajax = {};
		oParam.ajax.type = 'POST';
		oParam.ajax.url = '/rpc/messaging/?method=MESSAGING_EMAIL_SEND&rf=JSON&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
		oParam.ajax.data = sEmailData; 					//JSON.stringify(oEmailData);
		oParam.ajax.rf = 'JSON';
		oParam.ajax.dataType = 'JSON';
		oParam.ajax.success = function(bErr, oResponse, oParam)
		{
			if (bErr || oResponse.status != 'OK')
			{
				// Write to log file - email sending failed
				console.log("Email sending failed: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
			}
			else 
			{
				if (bLocal) {console.log('Log file Email sent to ' + oParam.settings.email);}
			}
		};
		myJquery.ajax(oParam);
	},

	getCodes: function(oParam, fCallBack, fCallBackProcess)
	{
		// Get list of AnZSIC Codes
		var sciqual = module.exports;
		var bLocal   = (oParam.settings.local != undefined) ? oParam.settings.local == "true" : false;
		var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
		var sCategory = (oParam.settings.anzsicCategory != undefined) ? oParam.settings.anzsicCategory : '12';

		var oSearch = 
		{
			fields: 
			[
				{"name": "code"},
				{"name": "description"},
				{'name': 'senewcode'}
			],
			filters:
			[
				{"name": "category", comparison: "EQUAL_TO", value1: sCategory}
			],
			sort:
			[
				{"name": (oParam.processingStep == 5 ? 'senewcode' : 'code'), 'direction': 'asc'}
			],
			options:
			{
				"rf": "JSON",
				"rows": "600"
			}
		};

		if (oParam.processingStep == 5)
		{
			oSearch.sort.push({name: 'code', direction: 'asc'});
		};

		oParam.ajax = {};
		oParam.ajax.type = 'POST';
		oParam.ajax.url = '/rpc/setup/?method=SETUP_AUDIT_ITEM_TYPE_SEARCH&advanced=1&rf=JSON&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
		oParam.ajax.data = JSON.stringify(oSearch);
		oParam.ajax.success = function(bErr, oResponse, oParam)
		{
			if (!bErr && oResponse.status === 'OK')
			{
				if (bLocal) {console.log(oResponse.data.rows.length + " ANZSIC Codes found..");}
				oParam.logHTML.push(oResponse.data.rows.length + " ANZSIC Codes found..");
				sciqual.data.mappings = 
				[
					{oldCode: '0111', newCode: '0111', newDesc: 'Nursery Production (Under Cover)'},
					{oldCode: '0112', newCode: '0114', newDesc: 'Floriculture Production (Under Cover)'},
					{oldCode: '0113', newCode: '0122', newDesc: 'Vegetable Growing (Under Cover)'},
					{oldCode: '0114', newCode: '0131', newDesc: 'Grape Growing'},
					{oldCode: '0115', newCode: '0134', newDesc: 'Apple and Pear Growing'},
					{oldCode: '0116', newCode: '0135', newDesc: 'Stone Fruit Growing'},
					{oldCode: '0117', newCode: '0132', newDesc: 'Kiwifruit Growing'},
					{oldCode: '0119', newCode: '0139', newDesc: 'Other Fruit and Tree Nut Growing'},
					{oldCode: '0120', newCode: '0145', newDesc: 'Grain-Sheep or Grain-Beef Cattle Farming'},
					{oldCode: '0121', newCode: '0149', newDesc: 'Other Grain Growing'},
					{oldCode: '0122', newCode: '0145', newDesc: 'Grain-Sheep or Grain-Beef Cattle Farming'},
					{oldCode: '0123', newCode: '0144', newDesc: 'Sheep-Beef Cattle Farming', action: 'delete'},
					{oldCode: '0124', newCode: '0144', action: 'delete'},
					{oldCode: '0125', newCode: '0144', action: 'delete'},
					{oldCode: '0130', newCode: '0160', newDesc: 'Dairy Cattle Farming'},
					{oldCode: '0141', newCode: '0171', newDesc: 'Poultry Farming (Meat)'},
					{oldCode: '0142', newCode: '0172', newDesc: 'Poultry Farming (Eggs) '},
					{oldCode: '0151', newCode: '0192', newDesc: 'Pig Farming'},
					{oldCode: '0152', newCode: '0191', newDesc: 'Horse Farming'},
					{oldCode: '0153', newCode: '0180', newDesc: 'Deer Farming'},
					{oldCode: '0159', newCode: '0199', newDesc: 'Other Livestock Farming n.e.c.'},
					{oldCode: '0161', newCode: '0151', newDesc: 'Sugar Cane Growing'},
					{oldCode: '0162', newCode: '0152', newDesc: 'Cotton Growing'},
					{oldCode: '0169', newCode: '0159', newDesc: 'Other Crop Growing n.e.c.'},
					{oldCode: '0211', newCode: '0521', newDesc: 'Cotton Ginning'},
					{oldCode: '0212', newCode: '0522', newDesc: 'Shearing Services'},
					{oldCode: '0213', newCode: '0529', newDesc: 'Other Agriculture and Fishing Support Services', action: 'delete'},
					{oldCode: '0219', newCode: '0529', action: 'delete'},
					{oldCode: '0220', newCode: '0420', newDesc: 'Hunting and Trapping'},
					{oldCode: '0301', newCode: '0301', newDesc: 'Forestry'},
					{oldCode: '0302', newCode: '0302', newDesc: 'Logging'},
					{oldCode: '0303', newCode: '0510', newDesc: 'Forestry Support Services'},
					{oldCode: '0411', newCode: '0411', newDesc: 'Rock Lobster and Crab Potting'},
					{oldCode: '0412', newCode: '0412', newDesc: 'Prawn Fishing'},
					{oldCode: '0413', newCode: '0414', newDesc: 'Fish Trawling, Seining and Netting'},
					{oldCode: '0414', newCode: '0413', newDesc: 'Line Fishing'},
					{oldCode: '0415', newCode: '0413', newDesc: 'Line Fishing'},
					{oldCode: '0419', newCode: '0419', newDesc: 'Other Fishing'},
					{oldCode: '0420', newCode: '0202', newDesc: 'Offshore Caged Aquaculture'},
					{oldCode: '1101', newCode: '0600', newDesc: 'Coal Mining', action: 'delete'},
					{oldCode: '1102', newCode: '0600', action: 'delete'},
					{oldCode: '1200', newCode: '0700', newDesc: 'Oil and Gas Extraction'},
					{oldCode: '1311', newCode: '0801', newDesc: 'Iron Ore Mining'},
					{oldCode: '1312', newCode: '0802', newDesc: 'Bauxite Mining'},
					{oldCode: '1313', newCode: '0803', newDesc: 'Copper Ore Mining'},
					{oldCode: '1314', newCode: '0804', newDesc: 'Gold Ore Mining'},
					{oldCode: '1315', newCode: '0805', newDesc: 'Mineral Sand Mining'},
					{oldCode: '1316', newCode: '0806', newDesc: 'Nickel Ore Mining'},
					{oldCode: '1317', newCode: '0807', newDesc: 'Silver-Lead-Zinc Ore Mining'},
					{oldCode: '1319', newCode: '0809', newDesc: 'Other Metal Ore Mining'},
					{oldCode: '1411', newCode: '0911', newDesc: 'Gravel and Sand Quarrying'},
					{oldCode: '1419', newCode: '0919', newDesc: 'Other Construction Material Mining'},
					{oldCode: '1420', newCode: '0990', newDesc: 'Other Non-Metallic Mineral Mining and Quarrying'},
					{oldCode: '1511', newCode: '1011', newDesc: 'Petroleum Exploration', action: 'delete'},
					{oldCode: '1512', newCode: '1011', action: 'delete'},
					{oldCode: '1513', newCode: '1012', newDesc: 'Mineral Exploration', action: 'delete'},
					{oldCode: '1514', newCode: '1012', action: 'delete'},
					{oldCode: '1520', newCode: '1090', newDesc: 'Other Mining Support Services'},
					{oldCode: '2111', newCode: '1111', newDesc: 'Meat Processing'},
					{oldCode: '2112', newCode: '1112', newDesc: 'Poultry Processing'},
					{oldCode: '2113', newCode: '1113', newDesc: 'Cured Meat and Smallgoods Manufacturing'},
					{oldCode: '2121', newCode: '1131', newDesc: 'Milk and Cream Processing'},
					{oldCode: '2122', newCode: '1132', newDesc: 'Ice Cream Manufacturing'},
					{oldCode: '2129', newCode: '1133', newDesc: 'Cheese and Other Dairy Product Manufacturing'},
					{oldCode: '2130', newCode: '1140', newDesc: 'Fruit and Vegetable Processing'},
					{oldCode: '2140', newCode: '1150', newDesc: 'Oil and Fat Manufacturing'},
					{oldCode: '2151', newCode: '1161', newDesc: 'Grain Mill Product Manufacturing'},
					{oldCode: '2152', newCode: '1162', newDesc: 'Cereal, Pasta and Baking Mix Manufacturing'},
					{oldCode: '2161', newCode: '1171', newDesc: 'Bread Manufacturing (Factory based)'},
					{oldCode: '2162', newCode: '1172', newDesc: 'Cake and Pastry Manufacturing (Factory based)'},
					{oldCode: '2163', newCode: '1173', newDesc: 'Biscuit Manufacturing (Factory based)'},
					{oldCode: '2171', newCode: '1181', newDesc: 'Sugar Manufacturing'},
					{oldCode: '2172', newCode: '1182', newDesc: 'Confectionery Manufacturing'},
					{oldCode: '2173', newCode: '1120', newDesc: 'Seafood Processing'},
					{oldCode: '2174', newCode: '1192', newDesc: 'Prepared Animal and Bird Feed Manufacturing'},
					{oldCode: '2179', newCode: '1199', newDesc: 'Other Food Product Manufacturing n.e.c.'},
					{oldCode: '2181', newCode: '1211', newDesc: 'Soft Drink, Cordial and Syrup Manufacturing'},
					{oldCode: '2182', newCode: '1212', newDesc: 'Beer Manufacturing'},
					{oldCode: '2183', newCode: '1214', newDesc: 'Wine and Other Alcoholic Beverage Manufacturing', action: 'delete'},
					{oldCode: '2184', newCode: '1214', action: 'delete'},
					{oldCode: '2190', newCode: '1220', newDesc: 'Cigarette and Tobacco Product Manufacturing'},
					{oldCode: '2211', newCode: '1311', newDesc: 'Wool Scouring'},
					{oldCode: '2212', newCode: '1313', newDesc: 'Synthetic Textile Manufacturing'},
					{oldCode: '2213', newCode: '1312', newDesc: 'Natural Textile Manufacturing', action: 'delete'},
					{oldCode: '2214', newCode: '1312', action: 'delete'},
					{oldCode: '2215', newCode: '1334', newDesc: 'Textile Finishing and Other Textile Product Manufacturing'},
					{oldCode: '2221', newCode: '1333', newDesc: 'Cut and Sewn Textile Product Manufacturing', action: 'delete'},
					{oldCode: '2222', newCode: '1331', newDesc: 'Textile Floor Covering Manufacturing'},
					{oldCode: '2223', newCode: '1332', newDesc: 'Rope, Cordage and Twine Manufacturing'},
					{oldCode: '2229', newCode: '1333', action: 'delete'},
					{oldCode: '2231', newCode: '1340', newDesc: 'Knitted Product Manufacturing', action: 'delete'},
					{oldCode: '2232', newCode: '1340', action: 'delete'},
					{oldCode: '2239', newCode: '1340', action: 'delete'},
					{oldCode: '2241', newCode: '1351', newDesc: 'Clothing Manufacturing', action: 'delete'},
					{oldCode: '2242', newCode: '1351', action: 'delete'},
					{oldCode: '2243', newCode: '1351', action: 'delete'},
					{oldCode: '2249', newCode: '1351', action: 'delete'},
					{oldCode: '2250', newCode: '1352', newDesc: 'Footwear Manufacturing'},
					{oldCode: '2261', newCode: '1320', newDesc: 'Leather Tanning, Fur Dressing and Leather Product Manufacturing', action: 'delete'},
					{oldCode: '2262', newCode: '1320', action: 'delete'},
					{oldCode: '2311', newCode: '1411', newDesc: 'Log Sawmilling'},
					{oldCode: '2312', newCode: '1412', newDesc: 'Wood Chipping'},
					{oldCode: '2313', newCode: '1413', newDesc: 'Timber Resawing and Dressing'},
					{oldCode: '2321', newCode: '1493', newDesc: 'Veneer and Plywood Manufacturing'},
					{oldCode: '2322', newCode: '1494', newDesc: 'Reconstituted Wood Product Manufacturing'},
					{oldCode: '2323', newCode: '1492', newDesc: 'Wooden Structural Fitting and Component Manufacturing'},
					{oldCode: '2329', newCode: '1499', newDesc: 'Other Wood Product Manufacturing n.e.c.'},
					{oldCode: '2331', newCode: '1510', newDesc: 'Pulp, Paper and Paperboard Manufacturing'},
					{oldCode: '2332', newCode: '1521', newDesc: 'Corrugated Paperboard and Paperboard Container Manufacturing', action: 'delete'},
					{oldCode: '2333', newCode: '1521', action: 'delete'},
					{oldCode: '2334', newCode: '1522', newDesc: 'Paper Bag Manufacturing'},
					{oldCode: '2339', newCode: '1529', newDesc: 'Other Converted Paper Product Manufacturing', action: 'delete'},
					{oldCode: '2411', newCode: '1529', action: 'delete'},
					{oldCode: '2412', newCode: '1611', newDesc: 'Printing', action: 'delete'},
					{oldCode: '2413', newCode: '1612', newDesc: 'Printing Support Services'},
					{oldCode: '2421', newCode: '1611', action: 'delete'},
					{oldCode: '2422', newCode: '5412', newDesc: 'Magazine and Other Periodical Publishing'},
					{oldCode: '2423', newCode: '5419', newDesc: 'Other Publishing (except Software, Music and Internet)'},
					{oldCode: '2430', newCode: '1620', newDesc: 'Reproduction of Recorded Media'},
					{oldCode: '2510', newCode: '1701', newDesc: 'Petroleum Refining and Petroleum Fuel Manufacturing'},
					{oldCode: '2520', newCode: '1709', newDesc: 'Other Petroleum and Coal Product Manufacturing'},
					{oldCode: '2531', newCode: '1831', newDesc: 'Fertiliser Manufacturing'},
					{oldCode: '2532', newCode: '1811', newDesc: 'Industrial Gas Manufacturing'},
					{oldCode: '2533', newCode: '1821', newDesc: 'Synthetic Resin and Synthetic Rubber Manufacturing'},
					{oldCode: '2534', newCode: '1812', newDesc: 'Basic Organic Chemical Manufacturing'},
					{oldCode: '2535', newCode: '1813', newDesc: 'Basic Inorganic Chemical Manufacturing'},
					{oldCode: '2541', newCode: '1892', newDesc: 'Explosive Manufacturing'},
					{oldCode: '2542', newCode: '1915', newDesc: 'Adhesive Manufacturing', action: 'delete'},
					{oldCode: '2543', newCode: '1841', newDesc: 'Human Pharmaceutical and Medicinal Product Manufacturing'},
					{oldCode: '2544', newCode: '1832', newDesc: 'Pesticide Manufacturing'},
					{oldCode: '2545', newCode: '1851', newDesc: 'Cleaning Compound Manufacturing'},
					{oldCode: '2546', newCode: '1852', newDesc: 'Cosmetic and Toiletry Preparation Manufacturing'},
					{oldCode: '2547', newCode: '1915', action: 'delete'},
					{oldCode: '2549', newCode: '1899', newDesc: 'Other Basic Chemical Product Manufacturing n.e.c.'},
					{oldCode: '2551', newCode: '1914', newDesc: 'Tyre Manufacturing'},
					{oldCode: '2559', newCode: '1920', newDesc: 'Natural Rubber Product Manufacturing'},
					{oldCode: '2561', newCode: '1912', newDesc: 'Rigid and Semi-Rigid Polymer Product Manufacturing', action: 'delete'},
					{oldCode: '2562', newCode: '1912', action: 'delete'},
					{oldCode: '2563', newCode: '1911', newDesc: 'Polymer Film and Sheet Packaging Material Manufacturing'},
					{oldCode: '2564', newCode: '1912', action: 'delete'},
					{oldCode: '2565', newCode: '1913', newDesc: 'Polymer Foam Product Manufacturing'},
					{oldCode: '2566', newCode: '1912', action: 'delete'},
					{oldCode: '2610', newCode: '2010', newDesc: 'Glass and Glass Product Manufacturing'},
					{oldCode: '2621', newCode: '2021', newDesc: 'Clay Brick Manufacturing'},
					{oldCode: '2622', newCode: '2029', newDesc: 'Other Ceramic Product Manufacturing', action: 'delete'},
					{oldCode: '2623', newCode: '2029', action: 'delete'},
					{oldCode: '2629', newCode: '2029', action: 'delete'},
					{oldCode: '2631', newCode: '2031', newDesc: 'Cement and Lime Manufacturing'},
					{oldCode: '2632', newCode: '2032', newDesc: 'Plaster Product Manufacturing'},
					{oldCode: '2633', newCode: '2033', newDesc: 'Ready-Mixed Concrete Manufacturing'},
					{oldCode: '2634', newCode: '2034', newDesc: 'Concrete Product Manufacturing', action: 'delete'},
					{oldCode: '2635', newCode: '2034', action: 'delete'},
					{oldCode: '2640', newCode: '2090', newDesc: 'Other Non-Metallic Mineral Product Manufacturing'},
					{oldCode: '2711', newCode: '2110', newDesc: 'Iron Smelting and Steel Manufacturing'},
					{oldCode: '2712', newCode: '2121', newDesc: 'Iron and Steel Casting'},
					{oldCode: '2713', newCode: '2122', newDesc: 'Steel Pipe and Tube Manufacturing'},
					{oldCode: '2721', newCode: '2131', newDesc: 'Alumina Production'},
					{oldCode: '2722', newCode: '2132', newDesc: 'Aluminium Smelting'},
					{oldCode: '2723', newCode: '2133', newDesc: 'Copper, Silver, Lead and Zinc Smelting and Refining'},
					{oldCode: '2729', newCode: '2139', newDesc: 'Other Basic Non-Ferrous Metal Manufacturing'},
					{oldCode: '2731', newCode: '2142', newDesc: 'Aluminium Rolling, Drawing, Extruding'},
					{oldCode: '2732', newCode: '2149', newDesc: 'Other Basic Non-Ferrous Metal Product Manufacturing'},
					{oldCode: '2733', newCode: '2141', newDesc: 'Non-Ferrous Metal Casting'},
					{oldCode: '2741', newCode: '2221', newDesc: 'Structural Steel Fabricating'},
					{oldCode: '2742', newCode: '2223', newDesc: 'Architectural Aluminium Product Manufacturing'},
					{oldCode: '2749', newCode: '2229', newDesc: 'Other Structural Metal Product Manufacturing'},
					{oldCode: '2751', newCode: '2239', newDesc: 'Other Metal Container Manufacturing'},
					{oldCode: '2759', newCode: '2240', newDesc: 'Sheet Metal Product Manufacturing (except Metal Structural and Container Products)'},
					{oldCode: '2761', newCode: '2299', newDesc: 'Other Fabricated Metal Product Manufacturing n.e.c.', action: 'delete'},
					{oldCode: '2762', newCode: '2291', newDesc: 'Spring and Wire Product Manufacturing'},
					{oldCode: '2763', newCode: '2292', newDesc: 'Nut, Bolt, Screw and Rivet Manufacturing'},
					{oldCode: '2764', newCode: '2293', newDesc: 'Metal Coating and Finishing'},
					{oldCode: '2765', newCode: '2299', action: 'delete'},
					{oldCode: '2769', newCode: '2299', action: 'delete'},
					{oldCode: '2811', newCode: '2311', newDesc: 'Motor Vehicle Manufacturing'},
					{oldCode: '2812', newCode: '2312', newDesc: 'Motor Vehicle Body and Trailer Manufacturing'},
					{oldCode: '2813', newCode: '2313', newDesc: 'Automotive Electrical Component Manufacturing'},
					{oldCode: '2819', newCode: '2319', newDesc: 'Other Motor Vehicle Parts Manufacturing'},
					{oldCode: '2821', newCode: '2391', newDesc: 'Shipbuilding and Repair Services'},
					{oldCode: '2822', newCode: '2392', newDesc: 'Boatbuilding and Repair Services'},
					{oldCode: '2823', newCode: '2393', newDesc: 'Railway Rolling Stock Manufacturing and Repair Services'},
					{oldCode: '2824', newCode: '2394', newDesc: 'Aircraft Manufacturing and Repair Services'},
					{oldCode: '2829', newCode: '2399', newDesc: 'Other Transport Equipment Manufacturing n.e.c.'},
					{oldCode: '2831', newCode: '2411', newDesc: 'Photographic, Optical and Ophthalmic Equipment Manufacturing'},
					{oldCode: '2832', newCode: '2412', newDesc: 'Medical and Surgical Equipment Manufacturing'},
					{oldCode: '2839', newCode: '2419', newDesc: 'Other Professional and Scientific Equipment Manufacturing'},
					{oldCode: '2841', newCode: '2421', newDesc: 'Computer and Electronic Office Equipment Manufacturing'},
					{oldCode: '2842', newCode: '2422', newDesc: 'Communications Equipment Manufacturing'},
					{oldCode: '2849', newCode: '2429', newDesc: 'Other Electronic Equipment Manufacturing'},
					{oldCode: '2851', newCode: '2441', newDesc: 'Whiteware Appliance Manufacturing'},
					{oldCode: '2852', newCode: '2431', newDesc: 'Electric Cable and Wire Manufacturing'},
					{oldCode: '2853', newCode: '2439', newDesc: 'Other Electrical Equipment Manufacturing', action: 'delete'},
					{oldCode: '2854', newCode: '2432', newDesc: 'Electric Lighting Equipment Manufacturing'},
					{oldCode: '2859', newCode: '2439', action: 'delete'},
					{oldCode: '2861', newCode: '2461', newDesc: 'Agricultural Machinery and Equipment Manufacturing'},
					{oldCode: '2862', newCode: '2462', newDesc: 'Mining and Construction Machinery Manufacturing'},
					{oldCode: '2863', newCode: '2469', newDesc: 'Other Specialised Machinery and Equipment Manufacturing', action: 'delete'},
					{oldCode: '2864', newCode: '2463', newDesc: 'Machine Tool and Parts Manufacturing'},
					{oldCode: '2865', newCode: '2491', newDesc: 'Lifting and Material Handling Equipment Manufacturing'},
					{oldCode: '2866', newCode: '2451', newDesc: 'Pump and Compressor Manufacturing'},
					{oldCode: '2867', newCode: '2452', newDesc: 'Fixed Space Heating, Cooling and Ventilation Equipment Manufacturing'},
					{oldCode: '2869', newCode: '2469', action: 'delete'},
					{oldCode: '2911', newCode: '2222', newDesc: 'Prefabricated Metal Building Manufacturing'},
					{oldCode: '2919', newCode: '1491', newDesc: 'Prefabricated Wooden Building Manufacturing'},
					{oldCode: '2920', newCode: '2511', newDesc: 'Wooden Furniture and Upholstered Seat Manufacturing'},
					{oldCode: '2921', newCode: '2511', newDesc: 'Wooden Furniture and Upholstered Seat Manufacturing'},
					{oldCode: '2922', newCode: '2512', newDesc: 'Metal Furniture Manufacturing'},
					{oldCode: '2923', newCode: '2513', newDesc: 'Mattress Manufacturing'},
					{oldCode: '2929', newCode: '2519', newDesc: 'Other Furniture Manufacturing'},
					{oldCode: '2941', newCode: '2591', newDesc: 'Jewellery and Silverware Manufacturing'},
					{oldCode: '2942', newCode: '2592', newDesc: 'Toy, Sporting and Recreational Product Manufacturing'},
					{oldCode: '2949', newCode: '2599', newDesc: 'Other Manufacturing n.e.c.'},
					{oldCode: '3610', newCode: '2611', newDesc: 'Fossil Fuel Electricity Generation'},
					{oldCode: '3620', newCode: '2700', newDesc: 'Gas Supply'},
					{oldCode: '3701', newCode: '2811', newDesc: 'Water Supply '},
					{oldCode: '3702', newCode: '2812', newDesc: 'Sewerage and Drainage Services'},
					{oldCode: '4111', newCode: '3011', newDesc: 'House Construction'},
					{oldCode: '4112', newCode: '3019', newDesc: 'Other Residential Building Construction'},
					{oldCode: '4113', newCode: '3020', newDesc: 'Non-Residential Building Construction'},
					{oldCode: '4121', newCode: '3101', newDesc: 'Road and Bridge Construction'},
					{oldCode: '4122', newCode: '3109', newDesc: 'Other Heavy and Civil Engineering Construction'},
					{oldCode: '4210', newCode: '3212', newDesc: 'Site Preparation Services'},
					{oldCode: '4221', newCode: '3221', newDesc: 'Concreting Services'},
					{oldCode: '4222', newCode: '3222', newDesc: 'Bricklaying Services'},
					{oldCode: '4223', newCode: '3223', newDesc: 'Roofing Services'},
					{oldCode: '4224', newCode: '3224', newDesc: 'Structural Steel Erection Services'},
					{oldCode: '4231', newCode: '3231', newDesc: 'Plumbing Services'},
					{oldCode: '4232', newCode: '3232', newDesc: 'Electrical Services'},
					{oldCode: '4233', newCode: '3233', newDesc: 'Air Conditioning and Heating Services'},
					{oldCode: '4234', newCode: '3234', newDesc: 'Fire and Security Alarm Installation Services'},
					{oldCode: '4241', newCode: '3241', newDesc: 'Plastering and Ceiling Services'},
					{oldCode: '4242', newCode: '3242', newDesc: 'Carpentry Services'},
					{oldCode: '4243', newCode: '3243', newDesc: 'Tiling and Carpeting Services'},
					{oldCode: '4244', newCode: '3244', newDesc: 'Painting and Decorating Services'},
					{oldCode: '4245', newCode: '3245', newDesc: 'Glazing Services'},
					{oldCode: '4251', newCode: '3291', newDesc: 'Landscape Construction Services'},
					{oldCode: '4259', newCode: '3299', newDesc: 'Other Construction Services n.e.c.'},
					{oldCode: '4511', newCode: '3311', newDesc: 'Wool Wholesaling'},
					{oldCode: '4512', newCode: '3312', newDesc: 'Cereal Grain Wholesaling'},
					{oldCode: '4519', newCode: '3319', newDesc: 'Other Agricultural Product Wholesaling'},
					{oldCode: '4521', newCode: '3321', newDesc: 'Petroleum Product Wholesaling'},
					{oldCode: '4522', newCode: '3322', newDesc: 'Metal and Mineral Wholesaling'},
					{oldCode: '4523', newCode: '3323', newDesc: 'Industrial and Agricultural Chemical Product Wholesaling'},
					{oldCode: '4531', newCode: '3331', newDesc: 'Timber Wholesaling'},
					{oldCode: '4539', newCode: '3339', newDesc: 'Other Hardware Goods Wholesaling'},
					{oldCode: '4611', newCode: '3411', newDesc: 'Agricultural and Construction Machinery Wholesaling'},
					{oldCode: '4612', newCode: '3491', newDesc: 'Professional and Scientific Goods Wholesaling'},
					{oldCode: '4613', newCode: '3492', newDesc: 'Computer and Computer Peripheral Wholesaling'},
					{oldCode: '4614', newCode: '3494', newDesc: 'Other Electrical and Electronic Good Wholesaling', action: 'delete'},
					{oldCode: '4615', newCode: '3494', action: 'delete'},
					{oldCode: '4619', newCode: '3499', newDesc: 'Other Machinery and Equipment Wholesaling n.e.c.'},
					{oldCode: '4621', newCode: '3501', newDesc: 'Car Wholesaling'},
					{oldCode: '4622', newCode: '3502', newDesc: 'Commercial Vehicle Wholesaling'},
					{oldCode: '4623', newCode: '3504', newDesc: 'Motor Vehicle New Parts Wholesaling'},
					{oldCode: '4624', newCode: '3505', newDesc: 'Motor Vehicle Dismantling and Used Parts Wholesaling'},
					{oldCode: '4711', newCode: '3602', newDesc: 'Meat, Poultry and Smallgoods Wholesaling', action: 'delete'},
					{oldCode: '4712', newCode: '3602', action: 'delete'},
					{oldCode: '4713', newCode: '3603', newDesc: 'Dairy Produce Wholesaling'},
					{oldCode: '4714', newCode: '3604', newDesc: 'Fish and Seafood Wholesaling'},
					{oldCode: '4715', newCode: '3605', newDesc: 'Fruit and Vegetable Wholesaling'},
					{oldCode: '4716', newCode: '3609', newDesc: 'Other Grocery Wholesaling', action: 'delete'},
					{oldCode: '4717', newCode: '3606', newDesc: 'Liquor and Tobacco Product Wholesaling', action: 'delete'},
					{oldCode: '4718', newCode: '3606', action: 'delete'},
					{oldCode: '4719', newCode: '3609', action: 'delete'},
					{oldCode: '4721', newCode: '3711', newDesc: 'Textile Product Wholesaling'},
					{oldCode: '4722', newCode: '3712', newDesc: 'Clothing and Footwear Wholesaling'},
					{oldCode: '4723', newCode: '3712', action: 'delete'},
					{oldCode: '4731', newCode: '3494', action: 'delete'},
					{oldCode: '4732', newCode: '3731', newDesc: 'Furniture and Floor Covering Wholesaling', action: 'delete'},
					{oldCode: '4733', newCode: '3731', action: 'delete'},
					{oldCode: '4739', newCode: '3739', newDesc: 'Other Goods Wholesaling n.e.c.', action: 'delete'},
					{oldCode: '4791', newCode: '3494', action: 'delete'},
					{oldCode: '4792', newCode: '3732', newDesc: 'Jewellery and Watch Wholesaling'},
					{oldCode: '4793', newCode: '3734', newDesc: 'Toy and Sporting Goods Wholesaling'},
					{oldCode: '4794', newCode: '3735', newDesc: 'Book and Magazine Wholesaling'},
					{oldCode: '4795', newCode: '3736', newDesc: 'Paper Product Wholesaling'},
					{oldCode: '4796', newCode: '3720', newDesc: 'Pharmaceutical and Toiletry Goods Wholesaling'},
					{oldCode: '4799', newCode: '3739', action: 'delete'},
					{oldCode: '5110', newCode: '4110', newDesc: 'Supermarket and Grocery Stores'},
					{oldCode: '5121', newCode: '4121', newDesc: 'Fresh Meat, Fish and Poultry Retailing'},
					{oldCode: '5122', newCode: '4122', newDesc: 'Fruit and Vegetable Retailing'},
					{oldCode: '5123', newCode: '4123', newDesc: 'Liquor Retailing'},
					{oldCode: '5124', newCode: '4129', newDesc: 'Other Specialised Food Retailing', action: 'delete'},
					{oldCode: '5125', newCode: '4512', newDesc: 'Takeaway Food Services'},
					{oldCode: '5126', newCode: '4310', newDesc: 'Non-Store Retailing'},
					{oldCode: '5129', newCode: '4129', action: 'delete'},
					{oldCode: '5210', newCode: '4260', newDesc: 'Department Stores'},
					{oldCode: '5221', newCode: '4251', newDesc: 'Clothing Retailing'},
					{oldCode: '5222', newCode: '4252', newDesc: 'Footwear Retailing'},
					{oldCode: '5223', newCode: '4214', newDesc: 'Manchester and Other Textile Goods Retailing'},
					{oldCode: '5231', newCode: '4211', newDesc: 'Furniture Retailing'},
					{oldCode: '5232', newCode: '4212', newDesc: 'Floor Coverings Retailing'},
					{oldCode: '5233', newCode: '4213', newDesc: 'Houseware Retailing'},
					{oldCode: '5234', newCode: '4221', newDesc: 'Electrical, Electronic and Gas Appliance Retailing'},
					{oldCode: '5235', newCode: '4242', newDesc: 'Entertainment Media Retailing'},
					{oldCode: '5241', newCode: '4241', newDesc: 'Sport and Camping Equipment Retailing'},
					{oldCode: '5242', newCode: '4243', newDesc: 'Toy and Game Retailing'},
					{oldCode: '5243', newCode: '4244', newDesc: 'Newspaper and Book Retailing'},
					{oldCode: '5244', newCode: '4279', newDesc: 'Other Store-Based Retailing n.e.c.', action: 'delete'},
					{oldCode: '5245', newCode: '4245', newDesc: 'Marine Equipment Retailing'},
					{oldCode: '5251', newCode: '4271', newDesc: 'Pharmaceutical, Cosmetic and Toiletry Goods Retailing'},
					{oldCode: '5252', newCode: '4273', newDesc: 'Antique and Used Goods Retailing'},
					{oldCode: '5253', newCode: '4232', newDesc: 'Garden Supplies Retailing'},
					{oldCode: '5254', newCode: '4274', newDesc: 'Flower Retailing'},
					{oldCode: '5255', newCode: '4279', action: 'delete'},
					{oldCode: '5259', newCode: '4279', action: 'delete'},
					{oldCode: '5261', newCode: '9499', newDesc: 'Other Repair and Maintenance n.e.c.'},
					{oldCode: '5269', newCode: '9491', newDesc: 'Clothing and Footwear Repair'},
					{oldCode: '5311', newCode: '3911', newDesc: 'Car Retailing'},
					{oldCode: '5312', newCode: '3912', newDesc: 'Motor Cycle Retailing'},
					{oldCode: '5313', newCode: '3913', newDesc: 'Trailer and Other Motor Vehicle Retailing'},
					{oldCode: '5321', newCode: '4000', newDesc: 'Fuel Retailing'},
					{oldCode: '5322', newCode: '9411', newDesc: 'Automotive Electrical Services'},
					{oldCode: '5323', newCode: '9412', newDesc: 'Automotive Body, Paint and Interior Repair'},
					{oldCode: '5324', newCode: '3922', newDesc: 'Tyre Retailing'},
					{oldCode: '5329', newCode: '9419', newDesc: 'Other Automotive Repair and Maintenance'},
					{oldCode: '5710', newCode: '4400', newDesc: 'Accommodation'},
					{oldCode: '5720', newCode: '4520', newDesc: 'Pubs, Taverns and Bars'},
					{oldCode: '5730', newCode: '4511', newDesc: 'Cafes and Restaurants'},
					{oldCode: '5740', newCode: '4530', newDesc: 'Clubs (Hospitality)'},
					{oldCode: '6110', newCode: '4610', newDesc: 'Road Freight Transport'},
					{oldCode: '6121', newCode: '4621', newDesc: 'Interurban and Rural Bus Transport'},
					{oldCode: '6122', newCode: '4622', newDesc: 'Urban Bus Transport (Including Tramway)'},
					{oldCode: '6123', newCode: '4623', newDesc: 'Taxi and Other Road Transport'},
					{oldCode: '6200', newCode: '4710', newDesc: 'Rail Freight Transport'},
					{oldCode: '6301', newCode: '4820', newDesc: 'Water Passenger Transport', action: 'delete'},
					{oldCode: '6302', newCode: '4820', action: 'delete'},
					{oldCode: '6303', newCode: '4820', action: 'delete'},
					{oldCode: '6401', newCode: '4900', newDesc: 'Air and Space Transport', action: 'delete'},
					{oldCode: '6402', newCode: '4900', action: 'delete'},
					{oldCode: '6403', newCode: '4900', action: 'delete'},
					{oldCode: '6501', newCode: '5021', newDesc: 'Pipeline Transport'},
					{oldCode: '6509', newCode: '5029', newDesc: 'Other Transport n.e.c.'},
					{oldCode: '6611', newCode: '9533', newDesc: 'Parking Services'},
					{oldCode: '6619', newCode: '5299', newDesc: 'Other Transport Support Services n.e.c.', action: 'delete'},
					{oldCode: '6621', newCode: '5211', newDesc: 'Stevedoring Services'},
					{oldCode: '6622', newCode: '5212', newDesc: 'Port and Water Transport Terminal Operations', action: 'delete'},
					{oldCode: '6623', newCode: '5212', action: 'delete'},
					{oldCode: '6629', newCode: '5219', newDesc: 'Other Water Transport Support Services'},
					{oldCode: '6630', newCode: '5220', newDesc: 'Airport Operations and Other Air Transport Support Services'},
					{oldCode: '6641', newCode: '7220', newDesc: 'Travel Agency and Tour Arrangement Services'},
					{oldCode: '6642', newCode: '5292', newDesc: 'Freight Forwarding Services', action: 'delete'},
					{oldCode: '6643', newCode: '5292', action: 'delete'},
					{oldCode: '6644', newCode: '5291', newDesc: 'Customs Agency Services'},
					{oldCode: '6649', newCode: '5299', action: 'delete'},
					{oldCode: '6701', newCode: '5301', newDesc: 'Grain Storage Services'},
					{oldCode: '6709', newCode: '5309', newDesc: 'Other Warehousing and Storage Services'},
					{oldCode: '7111', newCode: '5101', newDesc: 'Postal Services'},
					{oldCode: '7112', newCode: '5102', newDesc: 'Courier Pick-up and Delivery Services'},
					{oldCode: '7120', newCode: '5801', newDesc: 'Wired Telecommunications Network Operation'},
					{oldCode: '7310', newCode: '6210', newDesc: 'Central Banking'},
					{oldCode: '7321', newCode: '6221', newDesc: 'Banking'},
					{oldCode: '7322', newCode: '6222', newDesc: 'Building Society Operation'},
					{oldCode: '7323', newCode: '6223', newDesc: 'Credit Union Operation'},
					{oldCode: '7324', newCode: '6229', newDesc: 'Other Depository Financial Intermediation'},
					{oldCode: '7329', newCode: '6229', newDesc: 'Other Depository Financial Intermediation'},
					{oldCode: '7330', newCode: '6230', newDesc: 'Non-Depository Financing'},
					{oldCode: '7340', newCode: '6240', newDesc: 'Financial Asset Investing'},
					{oldCode: '7411', newCode: '6310', newDesc: 'Life Insurance'},
					{oldCode: '7412', newCode: '6330', newDesc: 'Superannuation Funds'},
					{oldCode: '7421', newCode: '6321', newDesc: 'Health Insurance'},
					{oldCode: '7422', newCode: '6322', newDesc: 'General Insurance'},
					{oldCode: '7511', newCode: '6411', newDesc: 'Financial Asset Broking Services'},
					{oldCode: '7519', newCode: '6419', newDesc: 'Other Auxiliary Finance and Investment Services'},
					{oldCode: '7520', newCode: '6420', newDesc: 'Auxiliary Insurance Services'},
					{oldCode: '7711', newCode: '6711', newDesc: 'Residential Property Operators '},
					{oldCode: '7712', newCode: '6712', newDesc: 'Non-Residential Property Operators '},
					{oldCode: '7720', newCode: '6720', newDesc: 'Real Estate Services '},
					{oldCode: '7730', newCode: '6640', newDesc: 'Non-Financial Intangible Assets (Except Copyrights) Leasing'},
					{oldCode: '7741', newCode: '6611', newDesc: 'Passenger Car Rental and Hiring'},
					{oldCode: '7742', newCode: '6619', newDesc: 'Other Motor Vehicle and Transport Equipment Rental and Hiring'},
					{oldCode: '7743', newCode: '6631', newDesc: 'Heavy Machinery and Scaffolding Rental and Hiring'},
					{oldCode: '7810', newCode: '6910', newDesc: 'Scientific Research Services'},
					{oldCode: '7821', newCode: '6921', newDesc: 'Architectural Services'},
					{oldCode: '7822', newCode: '6922', newDesc: 'Surveying and Mapping Services'},
					{oldCode: '7823', newCode: '6923', newDesc: 'Engineering Design and Engineering Consulting Services'},
					{oldCode: '7829', newCode: '6925', newDesc: 'Scientific Testing and Analysis Services'},
					{oldCode: '7831', newCode: '5921', newDesc: 'Data Processing and Web Hosting Services'},
					{oldCode: '7832', newCode: '5922', newDesc: 'Electronic Information Storage Services'},
					{oldCode: '7833', newCode: '9422', newDesc: 'Electronic (except Domestic Appliance) and Precision Equipment Repair and Maintenance'},
					{oldCode: '7834', newCode: '7000', newDesc: 'Computer System Design and Related Services'},
					{oldCode: '7841', newCode: '6931', newDesc: 'Legal Services'},
					{oldCode: '7842', newCode: '6932', newDesc: 'Accounting Services'},
					{oldCode: '7851', newCode: '6940', newDesc: 'Advertising Services'},
					{oldCode: '7852', newCode: '6924', newDesc: 'Other Specialised Design Services'},
					{oldCode: '7853', newCode: '6950', newDesc: 'Market Research and Statistical Services'},
					{oldCode: '7854', newCode: '6961', newDesc: 'Corporate Head Office Management Services'},
					{oldCode: '7855', newCode: '6962', newDesc: 'Management Advice and Related Consulting Services'},
					{oldCode: '7861', newCode: '7211', newDesc: 'Employment Placement and Recruitment Services', action: 'delete'},
					{oldCode: '7862', newCode: '7211', action: 'delete'},
					{oldCode: '7863', newCode: '7291', newDesc: 'Office Administrative Services'},
					{oldCode: '7864', newCode: '7712', newDesc: 'Investigation and Security Services'},
					{oldCode: '7865', newCode: '7312', newDesc: 'Building Pest Control Services'},
					{oldCode: '7866', newCode: '7311', newDesc: 'Building and Other Industrial Cleaning Services'},
					{oldCode: '7867', newCode: '7320', newDesc: 'Packaging Services'},
					{oldCode: '7869', newCode: '7299', newDesc: 'Other Administrative Services n.e.c.'},
					{oldCode: '8111', newCode: '7510', newDesc: 'Central Government Administration'},
					{oldCode: '8112', newCode: '7520', newDesc: 'State Government Administration'},
					{oldCode: '8113', newCode: '7530', newDesc: 'Local Government Administration'},
					{oldCode: '8120', newCode: '7540', newDesc: 'Justice'},
					{oldCode: '8130', newCode: '7552', newDesc: 'Foreign Government Representation'},
					{oldCode: '8200', newCode: '7600', newDesc: 'Defence'},
					{oldCode: '8410', newCode: '8010', newDesc: 'Preschool Education'},
					{oldCode: '8421', newCode: '8021', newDesc: 'Primary Education'},
					{oldCode: '8422', newCode: '8022', newDesc: 'Secondary Education'},
					{oldCode: '8423', newCode: '8023', newDesc: 'Combined Primary and Secondary Education'},
					{oldCode: '8424', newCode: '8024', newDesc: 'Special School Education'},
					{oldCode: '8431', newCode: '8102', newDesc: 'Higher Education'},
					{oldCode: '8432', newCode: '8101', newDesc: 'Technical and Vocational Education and Training', action: 'delete'},
					{oldCode: '8440', newCode: '8101', action: 'delete'},
					{oldCode: '8611', newCode: '8401', newDesc: 'Hospitals (Except Psychiatric Hospitals)'},
					{oldCode: '8612', newCode: '8402', newDesc: 'Psychiatric Hospitals'},
					{oldCode: '8613', newCode: '8601', newDesc: 'Aged Care Residential Services', action: 'delete'},
					{oldCode: '8621', newCode: '8511', newDesc: 'General Practice Medical Services'},
					{oldCode: '8622', newCode: '8520', newDesc: 'Pathology and Diagnostic Imaging Services', action: 'delete'},
					{oldCode: '8623', newCode: '8531', newDesc: 'Dental Services'},
					{oldCode: '8631', newCode: '8520', action: 'delete'},
					{oldCode: '8632', newCode: '8532', newDesc: 'Optometry and Optical Dispensing'},
					{oldCode: '8633', newCode: '8591', newDesc: 'Ambulance Services'},
					{oldCode: '8634', newCode: '8539', newDesc: 'Other Allied Health Services'},
					{oldCode: '8635', newCode: '8533', newDesc: 'Physiotherapy Services'},
					{oldCode: '8636', newCode: '8534', newDesc: 'Chiropractic and Osteopathic Services'},
					{oldCode: '8639', newCode: '8599', newDesc: 'Other Health Care Services n.e.c.'},
					{oldCode: '8640', newCode: '6970', newDesc: 'Veterinary Services'},
					{oldCode: '8710', newCode: '8710', newDesc: 'Child Care Services'},
					{oldCode: '8721', newCode: '8601', action: 'delete'},
					{oldCode: '8722', newCode: '8609', newDesc: 'Other Residential Care Services'},
					{oldCode: '8729', newCode: '8790', newDesc: 'Other Social Assistance Services'},
					{oldCode: '9111', newCode: '5511', newDesc: 'Motion Picture and Video Production'},
					{oldCode: '9112', newCode: '5512', newDesc: 'Motion Picture and Video Distribution'},
					{oldCode: '9113', newCode: '5513', newDesc: 'Motion Picture Exhibition'},
					{oldCode: '9121', newCode: '5610', newDesc: 'Radio Broadcasting'},
					{oldCode: '9122', newCode: '5621', newDesc: 'Free-to-Air Television Broadcasting'},
					{oldCode: '9210', newCode: '6010', newDesc: 'Libraries and Archives'},
					{oldCode: '9220', newCode: '8910', newDesc: 'Museum Operation'},
					{oldCode: '9231', newCode: '8921', newDesc: 'Zoological and Botanical Gardens Operation'},
					{oldCode: '9239', newCode: '8922', newDesc: 'Nature Reserves and Conservation Parks Operation'},
					{oldCode: '9241', newCode: '9001', newDesc: 'Performing Arts Operation'},
					{oldCode: '9242', newCode: '9002', newDesc: 'Creative Artists, Musicians, Writers and Performers', action: 'delete'},
					{oldCode: '9251', newCode: '5522', newDesc: 'Music and Other Sound Recording Activities'},
					{oldCode: '9252', newCode: '9003', newDesc: 'Performing Arts Venue Operation'},
					{oldCode: '9253', newCode: '9002', action: 'delete'},
					{oldCode: '9259', newCode: '9002', action: 'delete'},
					{oldCode: '9311', newCode: '9121', newDesc: 'Horse and Dog Racing Administration and Track Operation'},
					{oldCode: '9312', newCode: '9113', newDesc: 'Sports and Physical Recreation Venues, Grounds and Facilities Operation'},
					{oldCode: '9319', newCode: '9114', newDesc: 'Sports and Physical Recreation Administrative Service'},
					{oldCode: '9321', newCode: '9202', newDesc: 'Lottery Operation'},
					{oldCode: '9322', newCode: '9201', newDesc: 'Casino Operation'},
					{oldCode: '9329', newCode: '9209', newDesc: 'Other Gambling Activities'},
					{oldCode: '9330', newCode: '9131', newDesc: 'Amusement Parks and Centres Operation'},
					{oldCode: '9511', newCode: '6632', newDesc: 'Video and Other Electronic Media Rental and Hiring'},
					{oldCode: '9519', newCode: '6639', newDesc: 'Other Goods and Equipment Rental and Hiring n.e.c.'},
					{oldCode: '9521', newCode: '9531', newDesc: 'Laundry and Dry-Cleaning Services'},
					{oldCode: '9522', newCode: '9532', newDesc: 'Photographic Film Processing'},
					{oldCode: '9523', newCode: '6991', newDesc: 'Professional Photographic Services'},
					{oldCode: '9524', newCode: '9520', newDesc: 'Funeral, Crematorium and Cemetery Services'},
					{oldCode: '9525', newCode: '7313', newDesc: 'Gardening Services'},
					{oldCode: '9526', newCode: '9511', newDesc: 'Hairdressing and Beauty Services'},
					{oldCode: '9529', newCode: '9539', newDesc: 'Other Personal Services n.e.c.'},
					{oldCode: '9610', newCode: '9540', newDesc: 'Religious Services'},
					{oldCode: '9621', newCode: '9551', newDesc: 'Business and Professional Association Services'},
					{oldCode: '9622', newCode: '9552', newDesc: 'Labour Association Services'},
					{oldCode: '9629', newCode: '9559', newDesc: 'Other Interest Group Services n.e.c.'},
					{oldCode: '9631', newCode: '7711', newDesc: 'Police Services'},
					{oldCode: '9632', newCode: '7714', newDesc: 'Correctional and Detention Services'},
					{oldCode: '9633', newCode: '7713', newDesc: 'Fire Protection and Other Emergency Services'},
					{oldCode: '9634', newCode: '2911', newDesc: 'Solid Waste Collection Services'},
					{oldCode: '9700', newCode: '9601', newDesc: 'Private Households Employing Staff'},
					{oldCode: '0113', newCode: '0112', newDesc: 'Nursery Production (Outdoors)', action: 'add', newMapCode: '0122'},
					{newCode: '0113', newDesc: 'Turf Growing', action: 'add'},
					{newCode: '0115', newDesc: 'Floriculture Production (Outdoors)', action: 'add'},
					{newCode: '0121', newDesc: 'Mushroom Growing', action: 'add'},
					{newCode: '0123', newDesc: 'Vegetable Growing (Outdoors)', action: 'add'},
					{newCode: '0133', newDesc: 'Berry Fruit Growing', action: 'add'},
					{newCode: '0136', newDesc: 'Citrus Fruit Growing', action: 'add'},
					{newCode: '0137', newDesc: 'Olive Growing', action: 'add'},
					{newCode: '0141', newDesc: 'Sheep Farming (Specialised)', action: 'add'},
					{newCode: '0142', newDesc: 'Beef Cattle Farming (Specialised)', action: 'add'},
					{newCode: '0143', newDesc: 'Beef Cattle Feedlots (Specialised)', action: 'add'},
					{newCode: '0146', newDesc: 'Rice Growing', action: 'add'},
					{newCode: '0193', newDesc: 'Beekeeping', action: 'add'},
					{newCode: '0201', newDesc: 'Offshore Longline and Rack Aquaculture', action: 'add'},
					{newCode: '0203', newDesc: 'Onshore Aquaculture', action: 'add'},
					{newCode: '1174', newDesc: 'Bakery Product Manufacturing (Non-factory based)', action: 'add'},
					{newCode: '1191', newDesc: 'Potato, Corn and Other Crisp Manufacturing', action: 'add'},
					{newCode: '1213', newDesc: 'Spirit Manufacturing', action: 'add'},
					{newCode: '1523', newDesc: 'Paper Stationery Manufacturing', action: 'add'},
					{newCode: '1524', newDesc: 'Sanitary Paper Product Manufacturing', action: 'add'},
					{newCode: '1829', newDesc: 'Other Basic Polymer Manufacturing', action: 'add'},
					{newCode: '1842', newDesc: 'Veterinary Pharmaceutical and Medicinal Product Manufacturing', action: 'add'},
					{newCode: '1891', newDesc: 'Photographic Chemical Product Manufacturing', action: 'add'},
					{newCode: '1919', newDesc: 'Other Polymer Product Manufacturing', action: 'add'},
					{newCode: '2210', newDesc: 'Iron and Steel Forging', action: 'add'},
					{newCode: '2224', newDesc: 'Metal Roof and Guttering Manufacturing (except Aluminium)', action: 'add'},
					{newCode: '2231', newDesc: 'Boiler, Tank and Other Heavy Gauge Metal Container Manufacturing', action: 'add'},
					{newCode: '2449', newDesc: 'Other Domestic Appliance Manufacturing', action: 'add'},
					{newCode: '2499', newDesc: 'Other Machinery and Equipment Manufacturing n.e.c.', action: 'add'},
					{newCode: '2612', newDesc: 'Hydro-Electricity Generation', action: 'add'},
					{newCode: '2619', newDesc: 'Other Electricity Generation', action: 'add'},
					{newCode: '2620', newDesc: 'Electricity Transmission', action: 'add'},
					{newCode: '2630', newDesc: 'Electricity Distribution', action: 'add'},
					{newCode: '2640', newDesc: 'On Selling Electricity and Electricity Market Operation', action: 'add'},
					{newCode: '2919', newDesc: 'Other Waste Collection Services', action: 'add'},
					{newCode: '2921', newDesc: 'Waste Treatment and Disposal Services', action: 'add'},
					{oldCode: '9529', newCode: '2922', newDesc: 'Waste Remediation and Materials Recovery Services', action: 'add', newMapCode: '9539'},
					{newCode: '3211', newDesc: 'Land Development and Subdivision', action: 'add'},
					{newCode: '3239', newDesc: 'Other Building Installation Services', action: 'add'},
					{newCode: '3292', newDesc: 'Hire of Construction Machinery with Operator', action: 'add'},
					{newCode: '3332', newDesc: 'Plumbing Goods Wholesaling', action: 'add'},
					{newCode: '3419', newDesc: 'Other Specialised Industrial Machinery and Equipment Wholesaling', action: 'add'},
					{newCode: '3493', newDesc: 'Telecommunication Goods Wholesaling', action: 'add'},
					{newCode: '3503', newDesc: 'Trailer and Other Motor Vehicle Wholesaling', action: 'add'},
					{newCode: '3601', newDesc: 'General Line Grocery Wholesaling', action: 'add'},
					{newCode: '3733', newDesc: 'Kitchen and Diningware Wholesaling', action: 'add'},
					{newCode: '3800', newDesc: 'Commission-Based Wholesaling', action: 'add'},
					{newCode: '3921', newDesc: 'Motor Vehicle Parts Retailing', action: 'add'},
					{newCode: '4222', newDesc: 'Computer and Computer Peripheral Retailing', action: 'add'},
					{newCode: '4229', newDesc: 'Other Electrical and Electronic Goods Retailing', action: 'add'},
					{newCode: '4231', newDesc: 'Hardware and Building Supplies Retailing', action: 'add'},
					{newCode: '4253', newDesc: 'Watch and Jewellery Retailing', action: 'add'},
					{newCode: '4259', newDesc: 'Other Personal Accessory Retailing', action: 'add'},
					{newCode: '4272', newDesc: 'Stationery Goods Retailing', action: 'add'},
					{newCode: '4320', newDesc: 'Retail Commission-Based Buying and/or Selling', action: 'add'},
					{newCode: '4513', newDesc: 'Catering Services', action: 'add'},
					{newCode: '4720', newDesc: 'Rail Passenger Transport', action: 'add'},
					{newCode: '4810', newDesc: 'Water Freight Transport', action: 'add'},
					{newCode: '5010', newDesc: 'Scenic and Sightseeing Transport', action: 'add'},
					{newCode: '5411', newDesc: 'Newspaper Publishing', action: 'add'},
					{newCode: '5413', newDesc: 'Book Publishing', action: 'add'},
					{newCode: '5414', newDesc: 'Directory and Mailing List Publishing', action: 'add'},
					{newCode: '5420', newDesc: 'Software Publishing', action: 'add'},
					{newCode: '5514', newDesc: 'Post-production Services and Other Motion Picture and Video Activities', action: 'add'},
					{newCode: '5521', newDesc: 'Music Publishing', action: 'add'},
					{oldCode: '8722', newCode: '5622', newDesc: 'Cable and Other Subscription Broadcasting', action: 'add', newMapCode: '8609'},
					{newCode: '5700', newDesc: 'Internet Publishing and Broadcasting', action: 'add'},
					{oldCode: '6644', newCode: '5802', newDesc: 'Other Telecommunications Network Operation', action: 'add', newMapCode: '5291'},
					{oldCode: '6644', newCode: '5809', newDesc: 'Other Telecommunications Services', action: 'add', newMapCode: '5291'},
					{newCode: '5910', newDesc: 'Internet Service Providers and Web Search Portals', action: 'add'},
					{newCode: '6020', newDesc: 'Other Information Services', action: 'add'},
					{newCode: '6620', newDesc: 'Farm Animal and Bloodstock Leasing', action: 'add'},
					{newCode: '6999', newDesc: 'Other Professional, Scientific and Technical Services n.e.c.', action: 'add'},
					{newCode: '7212', newDesc: 'Labour Supply Services', action: 'add'},
					{newCode: '7292', newDesc: 'Document Preparation Services', action: 'add'},
					{newCode: '7293', newDesc: 'Credit Reporting and Debt Collection Services', action: 'add'},
					{newCode: '7294', newDesc: 'Call Centre Operation', action: 'add'},
					{newCode: '7551', newDesc: 'Domestic Government Representation', action: 'add'},
					{newCode: '7719', newDesc: 'Other Public Order and Safety Services ', action: 'add'},
					{newCode: '7720', newDesc: 'Regulatory Services', action: 'add'},
					{newCode: '8211', newDesc: 'Sports and Physical Recreation Instruction', action: 'add'},
					{newCode: '8212', newDesc: 'Arts Education', action: 'add'},
					{newCode: '8219', newDesc: 'Adult, Community and Other Education n.e.c.', action: 'add'},
					{newCode: '8220', newDesc: 'Educational Support Services', action: 'add'},
					{newCode: '8512', newDesc: 'Specialist Medical Services', action: 'add'},
					{newCode: '9111', newDesc: 'Health and Fitness Centres and Gymnasia Operation', action: 'add'},
					{newCode: '9112', newDesc: 'Sports and Physical Recreation Clubs and Sports Professionals', action: 'add'},
					{newCode: '9129', newDesc: 'Other Horse and Dog Racing Activities', action: 'add'},
					{newCode: '9139', newDesc: 'Amusement and Other Recreational Activities n.e.c.', action: 'add'},
					{newCode: '9421', newDesc: 'Domestic Appliance Repair and Maintenance', action: 'add'},
					{newCode: '9429', newDesc: 'Other Machinery and Equipment Repair and Maintenance', action: 'add'},
					{newCode: '9512', newDesc: 'Diet and Weight Reduction Centre Operation', action: 'add'},
					{newCode: '9534', newDesc: 'Brothel Keeping and Prostitution Services', action: 'add'},
					{newCode: '9602', newDesc: 'Undifferentiated Goods-Producing Activities of Private Households for Own Use', action: 'add'},
					{newCode: '9603', newDesc: 'Undifferentiated Service-Producing Activities of Private Households for Own Use', action: 'add'},
				];

				sciqual.data.anzsicCodes = oResponse.data.rows;

				// Now put the code mappings into the result set so we have matching ids
				var aMapsToAdd = [];

				for (var i = 0; i < sciqual.data.anzsicCodes.length; i++)
				{	
					var oCode = sciqual.data.anzsicCodes[i];
					// May be more than one row per code
					var aMap = myJquery.grep(sciqual.data.mappings, function(x) {return x.oldCode == oCode.code});
					if (aMap.length == 0) {aMap = myJquery.grep(sciqual.data.mappings, function(x) {return x.newCode == oCode.code});}
					if (aMap.length > 0)
					{
						for (var j = 0; j < aMap.length; j++)
						{
							var oMap = aMap[j];
							if (j == 0)
							{
								sciqual.data.anzsicCodes[i].newCode = oMap.oldCode;
								sciqual.data.anzsicCodes[i].newCode = oMap.newCode;
								sciqual.data.anzsicCodes[i].newDesc = oMap.newDesc;
								sciqual.data.anzsicCodes[i].action = (oMap.action) ? oMap.action : 'convert';
							}
							else
							{
								aMapsToAdd.push(
									{
										id: oCode.id,
										code: oCode.code,
										description: oCode.description, 
										senewcode: oCode.senewcode,
										oldCode: oMap.oldCode,
										newCode: oMap.newCode, 
										newDesc: oMap.newDesc, 
										action: oMap.action
									});
							}
						}
					}
				}

				sciqual.data.anzsicCodes = sciqual.data.anzsicCodes.concat(aMapsToAdd);
				debugger;

				fCallBack(oParam, fCallBack, fCallBackProcess);
			}
			else
			{
				// Write to the log file
				console.log("Error finding codes: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
				oParam.logHTML.push("Error finding codes: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));

				oParam.processingStep = -1;
				fCallBack(oParam, fCallBack, fCallBackProcess);
			}
		}
		myJquery.ajax(oParam);
	
	},

	moveanzsicCodes: 
	{
		process: function(oParam, fCallBack, fCallBackProcess)
		{
			// Task to move ANZSIC Codes 
			// First update code set, removing codes where necessary
			// Using list of ids of codes removed, delete codes from Auditors and Clients
			// Add extra codes where old code maps to more than one new code to both Auditors & Clients
			var sciqual = module.exports;
			var oAutomation;
			var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
			var bLocal   = (oParam.settings.local   != undefined) ? oParam.settings.local == "true"   : false;
			var bUpdate = true;
			var sCategory = (oParam.settings.anzsicCategory != undefined) ? oParam.settings.anzsicCategory : '12';
			var sData = '';
			var aRowsToDelete;
			var aRowsToAdd;
			var aRowsToUpdate;
			var bConverted = false;
			
			
			//debugger;

			if (oParam == undefined) {oParam = {}}
			if (oParam.processingStep === undefined) {oParam.processingStep = 0}
			if (oParam.currentObject === undefined) {oParam.currentObject = '32'}		// We do Auditors first, followed by Clients, then opportunites
			if (oParam.rowsToAdd) {aRowsToAdd = oParam.rowsToAdd}
			if (oParam.rowsToDelete) {aRowsToDelete = oParam.rowsToDelete}
			if (oParam.rowsToUpdate) {aRowsToUpdate = oParam.rowsToUpdate}

			// Get the Codes
			if (oParam.processingStep === 0)
			{
				oParam.logHTML = [];
				console.log(Date());
				oParam.logHTML.push(Date());

				oParam.processingStep = 1;	
				sciqual.getCodes(oParam, fCallBack, fCallBackProcess);
			}

			// Add new codes first
			else if (oParam.processingStep == 1)
			{
				var aItemsToAdd = myJquery.grep(sciqual.data.mappings, function(x) {return x.action == 'add'});
				if (oParam.addItemIndex == undefined) 
				{
					oParam.addItemIndex = 0
					console.log(aItemsToAdd.length + ' codes to add');
				}

				if (oParam.addItemIndex < aItemsToAdd.length)
				{
					var oThisItem = aItemsToAdd[oParam.addItemIndex];

					// Only add it if it doesn't already exist
					if (myJquery.grep(sciqual.data.anzsicCodes, function(x) {return x.code == oThisItem.newCode && x.senewcode == oThisItem.newCode}).length == 0)
					{
						sData = 'code=' + oThisItem.newCode + '&senewcode=' + oThisItem.newCode + '&description=' + encodeURIComponent(oThisItem.newDesc) + '&itemtypecategory=' + sCategory;
					}

					if (sData != '') {oParam.logHTML.push((!bTesting ? '' : 'Test ') + 'About to add ' + oThisItem.newCode)}
					if (sData != '' && !bTesting)
					{
						console.log('Adding ' + oThisItem.newCode);
						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/setup/?method=SETUP_AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							if (!bErr && oResponse.status === 'OK')
							{
								// Add into table
								sciqual.data.anzsicCodes.push(
								{
									id: oResponse.id,
									code: oThisItem.newCode,
									description: oThisItem.newDesc,
									oldCode: oThisItem.oldCode,
									newCode: oThisItem.newCode,
									newDesc: oThisItem.newDesc,
									action: 'add'
								});
								oParam.addItemIndex += 1;
							}
							else
							{
								oParam.logHTML.push("Error adding " + oThisItem.newCode + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								console.log("Error adding " + oThisItem.newCode + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.processingStep = -1;
							}
							fCallBack(oParam, fCallBack, fCallBackProcess);
						}
						myJquery.ajax(oParam);
					}
					else
					{
						oParam.addItemIndex += 1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				else
				{
					delete(oParam.addItemIndex);
					oParam.processingStep = 11;
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}
			}

			// Now set seNewCode (we update the entire data set later once all the other updates to Auditors & Clients are complete)
			else if (oParam.processingStep == 11)
			{
				var aItemsToUpdate = myJquery.grep(sciqual.data.anzsicCodes, function(x) {return x.action != 'add'})
				if (oParam.updateItemIndex == undefined) {oParam.updateItemIndex = 0}

				if (oParam.updateItemIndex < aItemsToUpdate.length)
				{
					var oThisItem = aItemsToUpdate[oParam.updateItemIndex];

					if (oThisItem.senewcode != oThisItem.newCode && oThisItem.newCode != undefined && oThisItem.senewcode != oThisItem.code)
					{
						sData = 'id=' + oThisItem.id + '&senewcode=' + (oThisItem.newCode == undefined || oThisItem.senewcode == 'undefined' ? oThisItem.code : oThisItem.newCode);
						console.log('Updating seNewCode: ' + oThisItem.code + ' to ' + (oThisItem.newCode == undefined || oThisItem.senewcode == 'undefined' ? oThisItem.code : oThisItem.newCode));
					}

					if (sData != '') {oParam.logHTML.push((!bTesting ? '' : 'Test ') + 'About to set seNewCode to ' + oThisItem.newCode + ' for id=' + oThisItem.id + ' and code=' + oThisItem.code)}
					
					if (sData != '' && !bTesting)
					{
						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/setup/?method=SETUP_AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							if (!bErr && oResponse.status === 'OK')
							{
								oParam.updateItemIndex += 1;
							}
							else
							{
								oParam.logHTML.push("Error updating " + oThisItem.newCode + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								console.log("Error updating " + oThisItem.newCode + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.processingStep = -1;
							}
							fCallBack(oParam, fCallBack, fCallBackProcess);
						}
						myJquery.ajax(oParam);
					}
					else
					{
						oParam.updateItemIndex += 1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				else
				{
					delete(oParam.updateItemIndex);
					oParam.processingStep = 2;
					sciqual.getCodes(oParam, fCallBack, fCallBackProcess);		// Get a refreshed list of codes to work with
				}
			}

			// Get a list of ITEM_TYPE records linked to to the currentObject. 
			// Only need to get those where mapping indicates they need to be deleted or added
			else if (oParam.processingStep === 2)
			{
				var sItemTypes = myJquery.map(myJquery.grep(sciqual.data.anzsicCodes, function(x) {return x.action != 'convert' && x.id && x.id != ''}), function(y) {return y.id}).join(',');
				oParam.logHTML.push('sItemTypes: ' + sItemTypes);

				var oSearch = 
				{
					fields: 
					[
						{"name": "itemtype"},
						{"name": "itemtypetext"},
						{"name": "audititemtype.itemtype.senewcode"},
						{"name": 'object'},
						{"name": "objectcontext"},
						{"name": 'startdate'},
						{'name': 'enddate'},
						{'name': 'approvedby'},
						{'name': 'approveddate'}
					],
					filters:
					[
						{"name": "object", comparison: "EQUAL_TO", value1: oParam.currentObject},
						{"name": "itemtypecategory", "comparison": "EQUAL_TO", value1: sCategory},
						{"name": 'itemtype', comparison: 'IN_LIST', value1: sItemTypes}
					],
					sorts:
					[
						{name: "objectcontext", direction: "asc"},
						{"name": "audititemtype.itemtype.senewcode", 'direction': 'asc'},
						{"name": "itemtypetext", 'direction': 'asc'},
					],
					options:
					{
						"rf": "JSON",
						"rows": "500"
					}
				};

				if (oParam.currentObject == '32')
				{
					oSearch.fields.push({name: "audititemtype.contactperson.firstname"});
					oSearch.fields.push({name: "audititemtype.contactperson.surname"});
				}
				else if (oParam.currentObject == '12')
				{
					oSearch.fields.push({name: "audititemtype.contactbusiness.tradename"});
				}
				else // opportunities
				{
					oSearch.fields.push({name: "audititemtype.opportunity.requestbycontactbusinesstext"});
				}

				console.log("Getting " + (oParam.currentObject == '32' ? 'Auditor' : (oParam.currentObject == '12' ? 'Client' : 'Opportunity')) + ' ANZSIC rows');
				oParam.ajax = {};
				oParam.ajax.type = 'POST';
				oParam.ajax.url = '/rpc/audit/?method=AUDIT_ITEM_TYPE_SEARCH' +
									'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
				oParam.ajax.data = JSON.stringify(oSearch);
				oParam.ajax.success = function(bErr, oResponse, oParam)
				{
					debugger;
					if (!bErr && oResponse.status === 'OK')
					{	
						sciqual.data.rowsToUpdate = oResponse.data.rows;
						oParam.response = oResponse;
						oParam.processingStep = 3;
					}
					else
					{
						console.log("Error calling AUDIT_ITEM_TYPE_SEARCH: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.logHTML.push("Error calling AUDIT_ITEM_TYPE_SEARCH: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
						oParam.processingStep = -1;
					}
					fCallBack(oParam, fCallBack, fCallBackProcess);
				};

				myJquery.ajax(oParam);
			}

			// Get more records if they exist
			else if (oParam.processingStep === 3)
			{
				if (oParam.response)
				{
					var oResponse = oParam.response;

					debugger;
					if (oResponse.morerows == "true")
					{
						console.log("Getting more rows")
						oParam.logHTML.push('');
						oParam.logHTML.push("Getting more rows");

						var sData = 'id=' + oResponse.moreid + '&startrow=' + (parseInt(oResponse.startrow) + parseInt(oResponse.rows)) + '&rows=' + oResponse.rows;

						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/core/?method=CORE_SEARCH_MORE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							if (!bErr && oResponse.status === 'OK')
							{
								sciqual.data.rowsToUpdate = sciqual.data.rowsToUpdate.concat(oResponse.data.rows);
								oParam.response = oResponse;
							}
							else
							{
								console.log("Error finding more rows: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.logHTML.push("Error finding more rows: " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.processingStep = -1;
							}
							fCallBack(oParam, fCallBack, fCallBackProcess);
						};

						myJquery.ajax(oParam);
					}
					// We have all the records, go to the next step
					else
					{
						oParam.processingStep = 4;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				else
				{
					console.log("oResponse not passed to step 3");
					oParam.logHTML.push("oResponse not passed to step 3");
					oParam.processingStep = -1;
				}

			}

			// Now work through the rows and update
			else if (oParam.processingStep == 4)
			{
				if (aRowsToDelete == undefined || aRowsToAdd == undefined || aRowsToUpdate == undefined)
				{
					var aToBeAdded = myJquery.grep(sciqual.data.anzsicCodes, function(x) {return x.action == 'add' && x.oldCode != undefined});
					var aToBeDeleted = myJquery.grep(sciqual.data.anzsicCodes, function(x) {return x.action == 'delete'});
					var aRemoveItemTypes = (oParam.removeItemTypes == undefined ? [] : oParam.removeItemTypes);
					if (oParam.currentObject == '32')
					{
						oParam.logHTML.push("ANZSIC codes: " + JSON.stringify(sciqual.data.anzsicCodes).replace(/\}\,\{/g, '}<br />{'));
					}
					console.log('aToBeDeleted: ' + aToBeDeleted.length + ' rows');

					// Get a unique list of codes where duplciates need to be deleted
					var aNewCodes = [];
					for (var i = 0; i < aToBeDeleted.length; i++)
					{
						var sCode = aToBeDeleted[i].newCode;
						if (myJquery.grep(aNewCodes, function(x) {return x == sCode}).length == 0)
						{
							aNewCodes.push(sCode);
						}
					}
					console.log('aNewCodes: ' + aNewCodes.join(','));
					oParam.logHTML.push('aNewCodes: ' + aNewCodes.join(','));

					// Now loop through all the data rows and determine if we need to remove any of them because of duplicates
					var sPrevObjectContext = '';
					var sPrevItem = '';
					var iRows = 0;
					var oBaseItem = {};
					aRowsToUpdate = [];
					for (var i = 0; i < sciqual.data.rowsToUpdate.length; i++)
					{
						var oThisItem = sciqual.data.rowsToUpdate[i];
						
						if (oThisItem.objectcontext != sPrevObjectContext) {iRows = 0}
						if (oThisItem['audititemtype.itemtype.senewcode'] != sPrevItem) {iRows = 0}

						if (aNewCodes.join(',').indexOf(oThisItem['audititemtype.itemtype.senewcode']) > -1)
						{
							iRows += 1;
							if (iRows > 1) 
							{
								sciqual.data.rowsToUpdate[i].delete = true;
								// Add the itemtype to the list of codes we have to delete at the end if it's supposed to be deleted
								if (myJquery.grep(aToBeDeleted, function(x) {return x.id == sciqual.data.rowsToUpdate[i].itemtype && x.newDesc == undefined}).length > 0
									&& myJquery.grep(aRemoveItemTypes, function(x) {return x == sciqual.data.rowsToUpdate[i].itemtype}).length == 0)
								{
									aRemoveItemTypes.push(sciqual.data.rowsToUpdate[i].itemtype);
								}
							}
							// check if itemtype is the correct one for this newCode. If not, we have to update this row
							else 
							{
								oBaseItem = myJquery.grep(sciqual.data.anzsicCodes, function(x) {return x.newCode == oThisItem['audititemtype.itemtype.senewcode'] && x.newDesc != undefined}).shift();
								if (oBaseItem && oBaseItem.id != oThisItem.itemtype)
								{
									aRowsToUpdate.push(
									{
										id: oThisItem.id,
										itemtype: oBaseItem.id,
										itemtypetext: oThisItem.itemtypetext
									});
								}
							}
						}
						sPrevItem = oThisItem['audititemtype.itemtype.senewcode'];
						sPrevObjectContext = oThisItem.objectcontext;
					}
					aRowsToDelete = myJquery.grep(sciqual.data.rowsToUpdate, function(x) {return x.delete == true});
					oParam.removeItemTypes = aRemoveItemTypes;

					console.log(aRowsToDelete.length + ' ' + (oParam.currentObject == '32' ? 'Auditor' : (oParam.currentObject == '12' ? 'Client' : 'Opportunity')) + ' rows to delete');
					oParam.logHTML.push(aRowsToDelete.length + ' ' + (oParam.currentObject == '32' ? 'Auditor' : (oParam.currentObject == '12' ? 'Client' : 'Opportunity')) + ' rows to delete');

					console.log('ItemTypes (ids) to delete: ' + aRemoveItemTypes.join(','));
					oParam.logHTML.push('ItemTypes (ids) to delete: ' + aRemoveItemTypes.join(','));

					console.log(aRowsToUpdate.length + ' ' + (oParam.currentObject == '32' ? 'Auditor' : (oParam.currentObject == '12' ? 'Client' : 'Opportunity')) + ' rows to update');
					oParam.logHTML.push(aRowsToUpdate.length + ' ' + (oParam.currentObject == '32' ? 'Auditor' : (oParam.currentObject == '12' ? 'Client' : 'Opportunity')) + ' rows to update');
					
					

					// Work out which rows need to have items added
					var sItemTypeIDs = ',' + myJquery.map(aToBeAdded, function(x) {return x.id}).join(',') + ',';
					console.log("To Be Added: " + sItemTypeIDs);
					aRowsToAdd = [];
					for (var i = 0; i < sciqual.data.rowsToUpdate.length; i++)
					{
						var oThisItem = sciqual.data.rowsToUpdate[i];

						if (sItemTypeIDs.indexOf(',' + oThisItem.itemtype + ',') > -1)
						{
							var aThisCode = myJquery.grep(aToBeAdded, function(x) {return x.id == oThisItem.itemtype});
							for (var j = 0; j < aThisCode.length; j++)
							{
								aRowsToAdd.push(
								{	
									itemtype: aThisCode[j].id,
									itemtypetext: aThisCode[j].code,
									startdate: oThisItem.startdate,
									enddate: oThisItem.enddate,
									approveddate: oThisItem.approveddate,
									approvedby: oThisItem.approvedby,
									object: oThisItem.object,
									objectcontext: oThisItem.objectcontext
								});
							}
						}
					}
					console.log(aRowsToAdd.length + ' ' + (oParam.currentObject == '32' ? 'Auditor' : (oParam.currentObject == '12' ? 'Client' : 'Opportunity')) + ' rows to add');
					oParam.logHTML.push(aRowsToAdd.length + ' ' + (oParam.currentObject == '32' ? 'Auditor' : (oParam.currentObject == '12' ? 'Client' : 'Opportunity')) + ' rows to add');

					oParam.rowsToAdd = aRowsToAdd;
					oParam.rowsToDelete = aRowsToDelete;
					oParam.rowsToUpdate = aRowsToUpdate;
				}



				if (oParam.removeIndex == undefined) {oParam.removeIndex = 0}
				if (oParam.addIndex == undefined) {oParam.addIndex = 0}

				//if (oParam.removeIndex == 0)
				//{
				//	oParam.removeIndex = aRowsToDelete.length;
				//	oParam.addIndex = aRowsToAdd.length;
				//}

				// Time to do the update
				if (oParam.removeIndex < aRowsToDelete.length)
				{
					var oAuditItem = aRowsToDelete[oParam.removeIndex];
					var sItemType = oAuditItem.itemtype;
					var sData = 'remove=1&id=' + oAuditItem.id;
					oAuditItem.objectcontexttext = sciqual.formatXHTML((oParam.currentObject == '32') 
													? oAuditItem['audititemtype.contactperson.firstname'] + ' ' + oAuditItem['audititemtype.contactperson.surname']
													: oAuditItem['audititemtype.contactbusiness.tradename']);

					console.log((!bTesting ? '' : 'Test ') + "Removing " + oAuditItem.itemtypetext + "/" + oAuditItem['audititemtype.itemtype.senewcode'] + " for " + oAuditItem.objectcontexttext);
					oParam.logHTML.push((!bTesting ? '' : 'Test ') + "Removing " + oAuditItem.itemtypetext + "/" + oAuditItem['audititemtype.itemtype.senewcode'] + " for " + oAuditItem.objectcontexttext);

					if (!bTesting)
					{
						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/ondemand/audit/?method=AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							//debugger;
							if (!bErr && oResponse.status === 'OK')
							{
								oParam.removeIndex += 1;
							}
							else
							{
								console.log("Error removing " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.logHTML.push("Error removing " + oAuditItem.itemtypetext + " for " + oAuditItem.objectcontexttext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.processingStep = -1;
							}
							fCallBack(oParam, fCallBack, fCallBackProcess);
						};

						myJquery.ajax(oParam);
					}
					else
					{
						oParam.removeIndex += 1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				// All records processed. Go to Clients or update Code descriptions
				else
				{
					if (oParam.addIndex == 0)		// Concat Add & Update rows
					{
						aRowsToAdd = aRowsToAdd.concat(aRowsToUpdate);
					}

					if (oParam.addIndex < aRowsToAdd.length)
					{
						var oAuditItem = aRowsToAdd[oParam.addIndex];
						var sItemType = oAuditItem.itemtype;
						var sData = 'itemtype=' + oAuditItem.itemtype;

						sData +=  (oAuditItem.id == undefined) 
										? '&startdate=' + oAuditItem.startdate + '&enddate=' + oAuditItem.enddate + '&approveddate=' + oAuditItem.approveddate +
										  '&approvedby=' + oAuditItem.approvedby +'&object=' + oAuditItem.object + '&objectcontext=' + oAuditItem.objectcontext + '&itemtypecategory=' + sCategory
										: '&id=' + oAuditItem.id;


						console.log((!bTesting ? '' : 'Test ') + (oAuditItem.id ? "Updating " : "Adding ") + oAuditItem.itemtype + ': ' + oAuditItem.itemtypetext);
						oParam.logHTML.push((!bTesting ? '' : 'Test ') + (oAuditItem.id ? "Updating " : "Adding ") + oAuditItem.itemtype);

						if (!bTesting)
						{
							oParam.ajax = {};
							oParam.ajax.type = 'POST';
							oParam.ajax.url = '/ondemand/audit/?method=AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
												'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
							oParam.ajax.data = sData;
							oParam.ajax.success = function(bErr, oResponse, oParam)
							{
								//debugger;
								if (!bErr && oResponse.status === 'OK')
								{
									oParam.addIndex += 1;
								}
								else
								{
									console.log("Error " + (oAuditItem.id ? "Updating " : "Adding ") + " " + oAuditItem.itemtype + " for " + oAuditItem.objectcontext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
									oParam.logHTML.push("Error " + (oAuditItem.id ? "Updating " : "Adding ") + " " + oAuditItem.itemtype + " for " + oAuditItem.objectcontext + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
									oParam.processingStep = -1;
								}
								fCallBack(oParam, fCallBack, fCallBackProcess);
							};

							myJquery.ajax(oParam);
						}
						else
						{
							oParam.addIndex += 1;
							fCallBack(oParam, fCallBack, fCallBackProcess);
						}
					}
					// All records processed. Go to Clients or update Code descriptions
					else
					{
						delete(oParam.removeIndex);
						delete(oParam.addIndex);
						delete(oParam.rowsToAdd);
						delete(oParam.rowsToDelete);
						delete(oParam.rowsToUpdate);
						console.log('');
						oParam.processingStep = (oParam.currentObject == '32') ? 2 : 5;
						oParam.currentObject = '12';
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}

			}

			// Now convert the codes and update the descriptions
			else if (oParam.processingStep == 5)
			{
				var aItemsToUpdate = myJquery.grep(sciqual.data.anzsicCodes, function(x) {return x.action != 'add'});
				//var sPrevNewCode = '';
				var sRemoveItemTypes = ',' + (oParam.removeItemTypes == undefined ? '' : oParam.removeItemTypes.join(',')) + ',';
				if (oParam.updateItemIndex == undefined) {oParam.updateItemIndex = 0}

				if (oParam.updateItemIndex < aItemsToUpdate.length)
				{
					var oThisItem = aItemsToUpdate[oParam.updateItemIndex];
					sPrevNewCode = (oParam.updateItemIndex > 0 ? aItemsToUpdate[oParam.updateItemIndex - 1] : '');

					if (sRemoveItemTypes.indexOf(',' + oThisItem.id + ',') == -1)				// (sPrevNewCode != oThisItem.senewcode)
					{
						sData = 'id=' + oThisItem.id + '&code=' + oThisItem.senewcode + '&description=' + encodeURIComponent(oThisItem.newDesc);
					}
					else
					{
						sData = 'id=' + oThisItem.id + '&remove=1';
					}

					console.log((!bTesting ? '' : 'Test ') + ' Final ' + (sRemoveItemTypes.indexOf(',' + oThisItem.id + ',') == -1 ? 'Update ' : 'Remove ') + oThisItem.code + ' to ' + oThisItem.newCode);
					oParam.logHTML.push((!bTesting ? '' : 'Test ') + ' Final ' + (sRemoveItemTypes.indexOf(',' + oThisItem.id + ',') == -1 ? 'Update ' : 'Remove ') + oThisItem.code + ' to ' + oThisItem.newCode);

					if (sData != '' && !bTesting)
					{
						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/rpc/setup/?method=SETUP_AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							//debugger;
							if (!bErr && oResponse.status === 'OK')
							{
								oParam.updateItemIndex += 1;
							}
							else
							{
								oParam.logHTML.push("Error updating " + oThisItem.newCode + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								console.log("Error updating " + oThisItem.newCode + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.processingStep = -1;
							}
							fCallBack(oParam, fCallBack, fCallBackProcess);
						}
						myJquery.ajax(oParam);
					}
					else
					{
						oParam.updateItemIndex += 1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}
				}
				else
				{
					delete(oParam.updateItemIndex);
					oParam.processingStep = 10;
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}
			}

			// All done sucessfully
			else if (oParam.processingStep === 10 || oParam.processingStep === -1)
			{
				delete(oParam.currentObject);
				oParam.errorOccurred = (oParam.processingStep === -1);
				sciqual.sendLogFile(oParam);
			}

		}
	},

	fixANZSICCodes:
	{
		process: function(oParam, fCallBack, fCallBackProcess)
		{
			var sciqual = module.exports;
			var oAutomation;
			var bTesting = (oParam.settings.testing != undefined) ? oParam.settings.testing == "true" : false;
			var bLocal   = (oParam.settings.local   != undefined) ? oParam.settings.local == "true"   : false;
			var bUpdate = true;
			var sCategory = (oParam.settings.anzsicCategory != undefined) ? oParam.settings.anzsicCategory : '3';
			var sData = '';
			var aUpdateRows = [];
			
			
			//debugger;

			if (oParam == undefined) {oParam = {}}
			if (oParam.processingStep === undefined) {oParam.processingStep = 0}
			if (oParam.updateRows) {aUpdateRows = oParam.updateRows}

			// Get the rows to update
			if (oParam.processingStep === 0)
			{
				oParam.logHTML = [];
				console.log(Date());
				oParam.logHTML.push(Date());

				oParam.processingStep = 1;	
				aUpdateRows =
				[
					{data: 'id=11670&itemtype=56', id: 11670},
					{data: 'id=13043&itemtype=56', id: 13043},
					{data: 'id=104103&itemtype=56', id: 104103},
					{data: 'id=13994&itemtype=56', id: 13994},
					{data: 'id=19670&itemtype=56', id: 19670},
					{data: 'id=108979&itemtype=56', id: 108979},
					{data: 'id=113627&itemtype=56', id: 113627},
					{data: 'id=2638&itemtype=71', id: 2638},
					{data: 'id=5823&itemtype=71', id: 5823},
					{data: 'id=7987&itemtype=71', id: 7987},
					{data: 'id=9472&itemtype=71', id: 9472},
					{data: 'id=9609&itemtype=71', id: 9609},
					{data: 'id=11046&itemtype=71', id: 11046},
					{data: 'id=13372&itemtype=71', id: 13372},
					{data: 'id=13996&itemtype=71', id: 13996},
					{data: 'id=14922&itemtype=71', id: 14922},
					{data: 'id=18635&itemtype=71', id: 18635},
					{data: 'id=19027&itemtype=71', id: 19027},
					{data: 'id=19087&itemtype=71', id: 19087},
					{data: 'id=19091&itemtype=71', id: 19091},
					{data: 'id=19095&itemtype=71', id: 19095},
					{data: 'id=19099&itemtype=71', id: 19099},
					{data: 'id=19103&itemtype=71', id: 19103},
					{data: 'id=19107&itemtype=71', id: 19107},
					{data: 'id=19118&itemtype=71', id: 19118},
					{data: 'id=19122&itemtype=71', id: 19122},
					{data: 'id=19162&itemtype=71', id: 19162},
					{data: 'id=19165&itemtype=71', id: 19165},
					{data: 'id=19168&itemtype=71', id: 19168},
					{data: 'id=19528&itemtype=71', id: 19528},
					{data: 'id=19547&itemtype=71', id: 19547},
					{data: 'id=19554&itemtype=71', id: 19554},
					{data: 'id=19649&itemtype=71', id: 19649},
					{data: 'id=19655&itemtype=71', id: 19655},
					{data: 'id=19671&itemtype=71', id: 19671},
					{data: 'id=19688&itemtype=71', id: 19688},
					{data: 'id=20367&itemtype=71', id: 20367},
					{data: 'id=20466&itemtype=71', id: 20466},
					{data: 'id=20495&itemtype=71', id: 20495},
					{data: 'id=20812&itemtype=71', id: 20812},
					{data: 'id=20835&itemtype=71', id: 20835},
					{data: 'id=21018&itemtype=71', id: 21018},
					{data: 'id=21836&itemtype=71', id: 21836},
					{data: 'id=26839&itemtype=71', id: 26839},
					{data: 'id=93678&itemtype=71', id: 93678},
					{data: 'id=94020&itemtype=71', id: 94020},
					{data: 'id=94437&itemtype=71', id: 94437},
					{data: 'id=95089&itemtype=71', id: 95089},
					{data: 'id=97880&itemtype=71', id: 97880},
					{data: 'id=101475&itemtype=71', id: 101475},
					{data: 'id=105415&itemtype=71', id: 105415},
					{data: 'id=106490&itemtype=71', id: 106490},
					{data: 'id=107990&itemtype=71', id: 107990},
					{data: 'id=108027&itemtype=71', id: 108027},
					{data: 'id=108666&itemtype=71', id: 108666},
					{data: 'id=109593&itemtype=71', id: 109593},
					{data: 'id=110436&itemtype=71', id: 110436},
					{data: 'id=113234&itemtype=71', id: 113234},
					{data: 'id=113631&itemtype=71', id: 113631},
					{data: 'id=115855&itemtype=71', id: 115855},
					{data: 'id=116264&itemtype=71', id: 116264},
					{data: 'id=11347&itemtype=98', id: 11347},
					{data: 'id=104847&itemtype=98', id: 104847},
					{data: 'id=641&itemtype=100', id: 641},
					{data: 'id=6827&itemtype=123', id: 6827},
					{data: 'id=100578&itemtype=123', id: 100578},
					{data: 'id=6830&itemtype=128', id: 6830},
					{data: 'id=21281&itemtype=131', id: 21281},
					{data: 'id=21337&itemtype=131', id: 21337},
					{data: 'id=21621&itemtype=131', id: 21621},
					{data: 'id=94992&itemtype=131', id: 94992},
					{data: 'id=95733&itemtype=131', id: 95733},
					{data: 'id=96163&itemtype=131', id: 96163},
					{data: 'id=98272&itemtype=131', id: 98272},
					{data: 'id=98314&itemtype=131', id: 98314},
					{data: 'id=100210&itemtype=131', id: 100210},
					{data: 'id=9766&itemtype=135', id: 9766},
					{data: 'id=21619&itemtype=135', id: 21619},
					{data: 'id=95861&itemtype=135', id: 95861},
					{data: 'id=6001&itemtype=138', id: 6001},
					{data: 'id=17212&itemtype=138', id: 17212},
					{data: 'id=6535&itemtype=138', id: 6535},
					{data: 'id=9767&itemtype=138', id: 9767},
					{data: 'id=20041&itemtype=138', id: 20041},
					{data: 'id=107251&itemtype=138', id: 107251},
					{data: 'id=21620&itemtype=143', id: 21620},
					{data: 'id=8584&itemtype=153', id: 8584},
					{data: 'id=11492&itemtype=153', id: 11492},
					{data: 'id=101508&itemtype=153', id: 101508},
					{data: 'id=644&itemtype=155', id: 644},
					{data: 'id=1224&itemtype=155', id: 1224},
					{data: 'id=1435&itemtype=155', id: 1435},
					{data: 'id=1691&itemtype=155', id: 1691},
					{data: 'id=1893&itemtype=155', id: 1893},
					{data: 'id=2663&itemtype=155', id: 2663},
					{data: 'id=3011&itemtype=155', id: 3011},
					{data: 'id=3307&itemtype=155', id: 3307},
					{data: 'id=3887&itemtype=155', id: 3887},
					{data: 'id=4684&itemtype=155', id: 4684},
					{data: 'id=5353&itemtype=155', id: 5353},
					{data: 'id=5549&itemtype=155', id: 5549},
					{data: 'id=5841&itemtype=155', id: 5841},
					{data: 'id=6539&itemtype=155', id: 6539},
					{data: 'id=6690&itemtype=155', id: 6690},
					{data: 'id=6836&itemtype=155', id: 6836},
					{data: 'id=7087&itemtype=155', id: 7087},
					{data: 'id=7762&itemtype=155', id: 7762},
					{data: 'id=7911&itemtype=155', id: 7911},
					{data: 'id=8003&itemtype=155', id: 8003},
					{data: 'id=8264&itemtype=155', id: 8264},
					{data: 'id=8450&itemtype=155', id: 8450},
					{data: 'id=8964&itemtype=155', id: 8964},
					{data: 'id=9222&itemtype=155', id: 9222},
					{data: 'id=9337&itemtype=155', id: 9337},
					{data: 'id=9482&itemtype=155', id: 9482},
					{data: 'id=9616&itemtype=155', id: 9616},
					{data: 'id=9772&itemtype=155', id: 9772},
					{data: 'id=9979&itemtype=155', id: 9979},
					{data: 'id=10502&itemtype=155', id: 10502},
					{data: 'id=10730&itemtype=155', id: 10730},
					{data: 'id=10923&itemtype=155', id: 10923},
					{data: 'id=11059&itemtype=155', id: 11059},
					{data: 'id=11214&itemtype=155', id: 11214},
					{data: 'id=11353&itemtype=155', id: 11353},
					{data: 'id=11493&itemtype=155', id: 11493},
					{data: 'id=11685&itemtype=155', id: 11685},
					{data: 'id=12334&itemtype=155', id: 12334},
					{data: 'id=12404&itemtype=155', id: 12404},
					{data: 'id=12783&itemtype=155', id: 12783},
					{data: 'id=12910&itemtype=155', id: 12910},
					{data: 'id=13051&itemtype=155', id: 13051},
					{data: 'id=13218&itemtype=155', id: 13218},
					{data: 'id=13391&itemtype=155', id: 13391},
					{data: 'id=13542&itemtype=155', id: 13542},
					{data: 'id=14004&itemtype=155', id: 14004},
					{data: 'id=14495&itemtype=155', id: 14495},
					{data: 'id=14783&itemtype=155', id: 14783},
					{data: 'id=16427&itemtype=155', id: 16427},
					{data: 'id=16630&itemtype=155', id: 16630},
					{data: 'id=17662&itemtype=155', id: 17662},
					{data: 'id=18450&itemtype=155', id: 18450},
					{data: 'id=18459&itemtype=155', id: 18459},
					{data: 'id=89444&itemtype=155', id: 89444},
					{data: 'id=93389&itemtype=155', id: 93389},
					{data: 'id=93532&itemtype=155', id: 93532},
					{data: 'id=96171&itemtype=155', id: 96171},
					{data: 'id=96451&itemtype=155', id: 96451},
					{data: 'id=99897&itemtype=155', id: 99897},
					{data: 'id=100014&itemtype=155', id: 100014},
					{data: 'id=103302&itemtype=155', id: 103302},
					{data: 'id=104854&itemtype=155', id: 104854},
					{data: 'id=108143&itemtype=155', id: 108143},
					{data: 'id=109359&itemtype=155', id: 109359},
					{data: 'id=109683&itemtype=155', id: 109683},
					{data: 'id=109874&itemtype=155', id: 109874},
					{data: 'id=110078&itemtype=155', id: 110078},
					{data: 'id=112847&itemtype=155', id: 112847},
					{data: 'id=113650&itemtype=155', id: 113650},
					{data: 'id=113895&itemtype=155', id: 113895},
					{data: 'id=114216&itemtype=155', id: 114216},
					{data: 'id=19635&itemtype=157', id: 19635},
					{data: 'id=104855&itemtype=157', id: 104855},
					{data: 'id=5355&itemtype=180', id: 5355},
					{data: 'id=5842&itemtype=180', id: 5842},
					{data: 'id=6841&itemtype=180', id: 6841},
					{data: 'id=8756&itemtype=180', id: 8756},
					{data: 'id=9775&itemtype=180', id: 9775},
					{data: 'id=11217&itemtype=180', id: 11217},
					{data: 'id=11497&itemtype=180', id: 11497},
					{data: 'id=17690&itemtype=180', id: 17690},
					{data: 'id=20901&itemtype=180', id: 20901},
					{data: 'id=105333&itemtype=180', id: 105333},
					{data: 'id=114218&itemtype=180', id: 114218},
					{data: 'id=8011&itemtype=180', id: 8011},
					{data: 'id=10733&itemtype=180', id: 10733},
					{data: 'id=14011&itemtype=180', id: 14011},
					{data: 'id=15874&itemtype=180', id: 15874},
					{data: 'id=18393&itemtype=180', id: 18393},
					{data: 'id=18399&itemtype=180', id: 18399},
					{data: 'id=18405&itemtype=180', id: 18405},
					{data: 'id=18411&itemtype=180', id: 18411},
					{data: 'id=18417&itemtype=180', id: 18417},
					{data: 'id=18423&itemtype=180', id: 18423},
					{data: 'id=18429&itemtype=180', id: 18429},
					{data: 'id=18435&itemtype=180', id: 18435},
					{data: 'id=18441&itemtype=180', id: 18441},
					{data: 'id=18585&itemtype=180', id: 18585},
					{data: 'id=19622&itemtype=180', id: 19622},
					{data: 'id=20464&itemtype=180', id: 20464},
					{data: 'id=20544&itemtype=180', id: 20544},
					{data: 'id=21019&itemtype=180', id: 21019},
					{data: 'id=21194&itemtype=180', id: 21194},
					{data: 'id=21373&itemtype=180', id: 21373},
					{data: 'id=21570&itemtype=180', id: 21570},
					{data: 'id=22530&itemtype=180', id: 22530},
					{data: 'id=28399&itemtype=180', id: 28399},
					{data: 'id=97366&itemtype=180', id: 97366},
					{data: 'id=98203&itemtype=180', id: 98203},
					{data: 'id=98303&itemtype=180', id: 98303},
					{data: 'id=100213&itemtype=180', id: 100213},
					{data: 'id=100311&itemtype=180', id: 100311},
					{data: 'id=106096&itemtype=180', id: 106096},
					{data: 'id=107980&itemtype=180', id: 107980},
					{data: 'id=111950&itemtype=180', id: 111950},
					{data: 'id=111952&itemtype=180', id: 111952},
					{data: 'id=112880&itemtype=180', id: 112880},
					{data: 'id=115712&itemtype=180', id: 115712},
					{data: 'id=116651&itemtype=180', id: 116651},
					{data: 'id=116672&itemtype=180', id: 116672},
					{data: 'id=5034&itemtype=188', id: 5034},
					{data: 'id=10246&itemtype=188', id: 10246},
					{data: 'id=11502&itemtype=188', id: 11502},
					{data: 'id=21574&itemtype=188', id: 21574},
					{data: 'id=113897&itemtype=188', id: 113897},
					{data: 'id=653&itemtype=194', id: 653},
					{data: 'id=2683&itemtype=194', id: 2683},
					{data: 'id=3617&itemtype=194', id: 3617},
					{data: 'id=6016&itemtype=194', id: 6016},
					{data: 'id=6844&itemtype=194', id: 6844},
					{data: 'id=8013&itemtype=194', id: 8013},
					{data: 'id=8980&itemtype=194', id: 8980},
					{data: 'id=10735&itemtype=194', id: 10735},
					{data: 'id=11505&itemtype=194', id: 11505},
					{data: 'id=14013&itemtype=194', id: 14013},
					{data: 'id=14292&itemtype=194', id: 14292},
					{data: 'id=14785&itemtype=194', id: 14785},
					{data: 'id=16583&itemtype=194', id: 16583},
					{data: 'id=16746&itemtype=194', id: 16746},
					{data: 'id=16869&itemtype=194', id: 16869},
					{data: 'id=16921&itemtype=194', id: 16921},
					{data: 'id=18215&itemtype=194', id: 18215},
					{data: 'id=18217&itemtype=194', id: 18217},
					{data: 'id=18219&itemtype=194', id: 18219},
					{data: 'id=18221&itemtype=194', id: 18221},
					{data: 'id=18223&itemtype=194', id: 18223},
					{data: 'id=18225&itemtype=194', id: 18225},
					{data: 'id=18227&itemtype=194', id: 18227},
					{data: 'id=18229&itemtype=194', id: 18229},
					{data: 'id=18231&itemtype=194', id: 18231},
					{data: 'id=18233&itemtype=194', id: 18233},
					{data: 'id=18235&itemtype=194', id: 18235},
					{data: 'id=18237&itemtype=194', id: 18237},
					{data: 'id=18239&itemtype=194', id: 18239},
					{data: 'id=18241&itemtype=194', id: 18241},
					{data: 'id=18394&itemtype=194', id: 18394},
					{data: 'id=18400&itemtype=194', id: 18400},
					{data: 'id=18406&itemtype=194', id: 18406},
					{data: 'id=18412&itemtype=194', id: 18412},
					{data: 'id=18418&itemtype=194', id: 18418},
					{data: 'id=18424&itemtype=194', id: 18424},
					{data: 'id=18430&itemtype=194', id: 18430},
					{data: 'id=18436&itemtype=194', id: 18436},
					{data: 'id=18442&itemtype=194', id: 18442},
					{data: 'id=19647&itemtype=194', id: 19647},
					{data: 'id=19715&itemtype=194', id: 19715},
					{data: 'id=19988&itemtype=194', id: 19988},
					{data: 'id=20045&itemtype=194', id: 20045},
					{data: 'id=20792&itemtype=194', id: 20792},
					{data: 'id=20913&itemtype=194', id: 20913},
					{data: 'id=21180&itemtype=194', id: 21180},
					{data: 'id=21302&itemtype=194', id: 21302},
					{data: 'id=21814&itemtype=194', id: 21814},
					{data: 'id=22483&itemtype=194', id: 22483},
					{data: 'id=26800&itemtype=194', id: 26800},
					{data: 'id=95708&itemtype=194', id: 95708},
					{data: 'id=95710&itemtype=194', id: 95710},
					{data: 'id=95713&itemtype=194', id: 95713},
					{data: 'id=95715&itemtype=194', id: 95715},
					{data: 'id=96053&itemtype=194', id: 96053},
					{data: 'id=97482&itemtype=194', id: 97482},
					{data: 'id=97486&itemtype=194', id: 97486},
					{data: 'id=97490&itemtype=194', id: 97490},
					{data: 'id=97494&itemtype=194', id: 97494},
					{data: 'id=97498&itemtype=194', id: 97498},
					{data: 'id=97502&itemtype=194', id: 97502},
					{data: 'id=97506&itemtype=194', id: 97506},
					{data: 'id=97510&itemtype=194', id: 97510},
					{data: 'id=99832&itemtype=194', id: 99832},
					{data: 'id=100379&itemtype=194', id: 100379},
					{data: 'id=101536&itemtype=194', id: 101536},
					{data: 'id=102711&itemtype=194', id: 102711},
					{data: 'id=103289&itemtype=194', id: 103289},
					{data: 'id=103475&itemtype=194', id: 103475},
					{data: 'id=103578&itemtype=194', id: 103578},
					{data: 'id=103776&itemtype=194', id: 103776},
					{data: 'id=106006&itemtype=194', id: 106006},
					{data: 'id=106459&itemtype=194', id: 106459},
					{data: 'id=107197&itemtype=194', id: 107197},
					{data: 'id=107792&itemtype=194', id: 107792},
					{data: 'id=109691&itemtype=194', id: 109691},
					{data: 'id=111916&itemtype=194', id: 111916},
					{data: 'id=113027&itemtype=194', id: 113027},
					{data: 'id=115754&itemtype=194', id: 115754},
					{data: 'id=116352&itemtype=194', id: 116352},
					{data: 'id=118441&itemtype=194', id: 118441},
					{data: 'id=118480&itemtype=194', id: 118480},
					{data: 'id=118593&itemtype=194', id: 118593},
					{data: 'id=119071&itemtype=194', id: 119071},
					{data: 'id=108486&itemtype=212', id: 108486},
					{data: 'id=111959&itemtype=212', id: 111959},
					{data: 'id=111981&itemtype=212', id: 111981},
					{data: 'id=111983&itemtype=212', id: 111983},
					{data: 'id=4710&itemtype=212', id: 4710},
					{data: 'id=5046&itemtype=212', id: 5046},
					{data: 'id=5566&itemtype=212', id: 5566},
					{data: 'id=6026&itemtype=212', id: 6026},
					{data: 'id=8021&itemtype=212', id: 8021},
					{data: 'id=8270&itemtype=212', id: 8270},
					{data: 'id=8982&itemtype=212', id: 8982},
					{data: 'id=10743&itemtype=212', id: 10743},
					{data: 'id=11356&itemtype=212', id: 11356},
					{data: 'id=14299&itemtype=212', id: 14299},
					{data: 'id=15858&itemtype=212', id: 15858},
					{data: 'id=16969&itemtype=212', id: 16969},
					{data: 'id=17676&itemtype=212', id: 17676},
					{data: 'id=17679&itemtype=212', id: 17679},
					{data: 'id=18379&itemtype=212', id: 18379},
					{data: 'id=18384&itemtype=212', id: 18384},
					{data: 'id=18577&itemtype=212', id: 18577},
					{data: 'id=18847&itemtype=212', id: 18847},
					{data: 'id=18992&itemtype=212', id: 18992},
					{data: 'id=19196&itemtype=212', id: 19196},
					{data: 'id=19494&itemtype=212', id: 19494},
					{data: 'id=19624&itemtype=212', id: 19624},
					{data: 'id=19837&itemtype=212', id: 19837},
					{data: 'id=19884&itemtype=212', id: 19884},
					{data: 'id=21086&itemtype=212', id: 21086},
					{data: 'id=21294&itemtype=212', id: 21294},
					{data: 'id=21410&itemtype=212', id: 21410},
					{data: 'id=21567&itemtype=212', id: 21567},
					{data: 'id=21685&itemtype=212', id: 21685},
					{data: 'id=21690&itemtype=212', id: 21690},
					{data: 'id=21803&itemtype=212', id: 21803},
					{data: 'id=27889&itemtype=212', id: 27889},
					{data: 'id=27891&itemtype=212', id: 27891},
					{data: 'id=29084&itemtype=212', id: 29084},
					{data: 'id=89614&itemtype=212', id: 89614},
					{data: 'id=98180&itemtype=212', id: 98180},
					{data: 'id=102230&itemtype=212', id: 102230},
					{data: 'id=102510&itemtype=212', id: 102510},
					{data: 'id=103671&itemtype=212', id: 103671},
					{data: 'id=103806&itemtype=212', id: 103806},
					{data: 'id=105992&itemtype=212', id: 105992},
					{data: 'id=106772&itemtype=212', id: 106772},
					{data: 'id=108801&itemtype=212', id: 108801},
					{data: 'id=108901&itemtype=212', id: 108901},
					{data: 'id=111611&itemtype=212', id: 111611},
					{data: 'id=114224&itemtype=212', id: 114224},
					{data: 'id=115302&itemtype=212', id: 115302},
					{data: 'id=115504&itemtype=212', id: 115504},
					{data: 'id=115517&itemtype=212', id: 115517},
					{data: 'id=116992&itemtype=212', id: 116992},
					{data: 'id=117073&itemtype=212', id: 117073},
					{data: 'id=117496&itemtype=212', id: 117496},
					{data: 'id=2249&itemtype=235', id: 2249},
					{data: 'id=2720&itemtype=235', id: 2720},
					{data: 'id=3337&itemtype=235', id: 3337},
					{data: 'id=3637&itemtype=235', id: 3637},
					{data: 'id=4284&itemtype=235', id: 4284},
					{data: 'id=5058&itemtype=235', id: 5058},
					{data: 'id=6293&itemtype=235', id: 6293},
					{data: 'id=8027&itemtype=235', id: 8027},
					{data: 'id=9787&itemtype=235', id: 9787},
					{data: 'id=11517&itemtype=235', id: 11517},
					{data: 'id=14024&itemtype=235', id: 14024},
					{data: 'id=16788&itemtype=235', id: 16788},
					{data: 'id=17240&itemtype=235', id: 17240},
					{data: 'id=17687&itemtype=235', id: 17687},
					{data: 'id=18480&itemtype=235', id: 18480},
					{data: 'id=18596&itemtype=235', id: 18596},
					{data: 'id=19765&itemtype=235', id: 19765},
					{data: 'id=19879&itemtype=235', id: 19879},
					{data: 'id=19969&itemtype=235', id: 19969},
					{data: 'id=20006&itemtype=235', id: 20006},
					{data: 'id=20386&itemtype=235', id: 20386},
					{data: 'id=21035&itemtype=235', id: 21035},
					{data: 'id=21122&itemtype=235', id: 21122},
					{data: 'id=21152&itemtype=235', id: 21152},
					{data: 'id=21434&itemtype=235', id: 21434},
					{data: 'id=27141&itemtype=235', id: 27141},
					{data: 'id=92754&itemtype=235', id: 92754},
					{data: 'id=93392&itemtype=235', id: 93392},
					{data: 'id=93539&itemtype=235', id: 93539},
					{data: 'id=93741&itemtype=235', id: 93741},
					{data: 'id=94029&itemtype=235', id: 94029},
					{data: 'id=94752&itemtype=235', id: 94752},
					{data: 'id=94849&itemtype=235', id: 94849},
					{data: 'id=96211&itemtype=235', id: 96211},
					{data: 'id=96574&itemtype=235', id: 96574},
					{data: 'id=96689&itemtype=235', id: 96689},
					{data: 'id=97536&itemtype=235', id: 97536},
					{data: 'id=97541&itemtype=235', id: 97541},
					{data: 'id=98220&itemtype=235', id: 98220},
					{data: 'id=98241&itemtype=235', id: 98241},
					{data: 'id=98342&itemtype=235', id: 98342},
					{data: 'id=98424&itemtype=235', id: 98424},
					{data: 'id=98856&itemtype=235', id: 98856},
					{data: 'id=100444&itemtype=235', id: 100444},
					{data: 'id=103005&itemtype=235', id: 103005},
					{data: 'id=103191&itemtype=235', id: 103191},
					{data: 'id=103450&itemtype=235', id: 103450},
					{data: 'id=103642&itemtype=235', id: 103642},
					{data: 'id=105728&itemtype=235', id: 105728},
					{data: 'id=106072&itemtype=235', id: 106072},
					{data: 'id=106076&itemtype=235', id: 106076},
					{data: 'id=107182&itemtype=235', id: 107182},
					{data: 'id=109286&itemtype=235', id: 109286},
					{data: 'id=110784&itemtype=235', id: 110784},
					{data: 'id=112290&itemtype=235', id: 112290},
					{data: 'id=113111&itemtype=235', id: 113111},
					{data: 'id=113793&itemtype=235', id: 113793},
					{data: 'id=114181&itemtype=235', id: 114181},
					{data: 'id=114343&itemtype=235', id: 114343},
					{data: 'id=114423&itemtype=235', id: 114423},
					{data: 'id=114427&itemtype=235', id: 114427},
					{data: 'id=118469&itemtype=235', id: 118469},
					{data: 'id=118836&itemtype=235', id: 118836},
					{data: 'id=670&itemtype=240', id: 670},
					{data: 'id=926&itemtype=240', id: 926},
					{data: 'id=2724&itemtype=240', id: 2724},
					{data: 'id=4722&itemtype=240', id: 4722},
					{data: 'id=5061&itemtype=240', id: 5061},
					{data: 'id=6296&itemtype=240', id: 6296},
					{data: 'id=6848&itemtype=240', id: 6848},
					{data: 'id=8031&itemtype=240', id: 8031},
					{data: 'id=8986&itemtype=240', id: 8986},
					{data: 'id=10751&itemtype=240', id: 10751},
					{data: 'id=14026&itemtype=240', id: 14026},
					{data: 'id=14311&itemtype=240', id: 14311},
					{data: 'id=14557&itemtype=240', id: 14557},
					{data: 'id=15357&itemtype=240', id: 15357},
					{data: 'id=18396&itemtype=240', id: 18396},
					{data: 'id=18402&itemtype=240', id: 18402},
					{data: 'id=18408&itemtype=240', id: 18408},
					{data: 'id=18414&itemtype=240', id: 18414},
					{data: 'id=18420&itemtype=240', id: 18420},
					{data: 'id=18426&itemtype=240', id: 18426},
					{data: 'id=18432&itemtype=240', id: 18432},
					{data: 'id=18438&itemtype=240', id: 18438},
					{data: 'id=18659&itemtype=240', id: 18659},
					{data: 'id=18859&itemtype=240', id: 18859},
					{data: 'id=18866&itemtype=240', id: 18866},
					{data: 'id=19986&itemtype=240', id: 19986},
					{data: 'id=20066&itemtype=240', id: 20066},
					{data: 'id=20080&itemtype=240', id: 20080},
					{data: 'id=20535&itemtype=240', id: 20535},
					{data: 'id=21084&itemtype=240', id: 21084},
					{data: 'id=21292&itemtype=240', id: 21292},
					{data: 'id=21295&itemtype=240', id: 21295},
					{data: 'id=21494&itemtype=240', id: 21494},
					{data: 'id=21572&itemtype=240', id: 21572},
					{data: 'id=93288&itemtype=240', id: 93288},
					{data: 'id=93393&itemtype=240', id: 93393},
					{data: 'id=96216&itemtype=240', id: 96216},
					{data: 'id=96544&itemtype=240', id: 96544},
					{data: 'id=98249&itemtype=240', id: 98249},
					{data: 'id=98660&itemtype=240', id: 98660},
					{data: 'id=99901&itemtype=240', id: 99901},
					{data: 'id=104001&itemtype=240', id: 104001},
					{data: 'id=106513&itemtype=240', id: 106513},
					{data: 'id=108802&itemtype=240', id: 108802},
					{data: 'id=114864&itemtype=240', id: 114864},
					{data: 'id=114895&itemtype=240', id: 114895},
					{data: 'id=114908&itemtype=240', id: 114908},
					{data: 'id=116920&itemtype=240', id: 116920},
					{data: 'id=118169&itemtype=240', id: 118169},
					{data: 'id=118483&itemtype=240', id: 118483},
					{data: 'id=119148&itemtype=240', id: 119148},
					{data: 'id=119512&itemtype=240', id: 119512},
					{data: 'id=8071&itemtype=291', id: 8071},
					{data: 'id=11382&itemtype=291', id: 11382},
					{data: 'id=15186&itemtype=291', id: 15186},
					{data: 'id=15187&itemtype=291', id: 15187},
					{data: 'id=15188&itemtype=291', id: 15188},
					{data: 'id=15189&itemtype=291', id: 15189},
					{data: 'id=15190&itemtype=291', id: 15190},
					{data: 'id=16733&itemtype=291', id: 16733},
					{data: 'id=17516&itemtype=291', id: 17516},
					{data: 'id=17659&itemtype=291', id: 17659},
					{data: 'id=18317&itemtype=291', id: 18317},
					{data: 'id=18509&itemtype=291', id: 18509},
					{data: 'id=18665&itemtype=291', id: 18665},
					{data: 'id=18874&itemtype=291', id: 18874},
					{data: 'id=18880&itemtype=291', id: 18880},
					{data: 'id=18886&itemtype=291', id: 18886},
					{data: 'id=19000&itemtype=291', id: 19000},
					{data: 'id=19010&itemtype=291', id: 19010},
					{data: 'id=19025&itemtype=291', id: 19025},
					{data: 'id=19171&itemtype=291', id: 19171},
					{data: 'id=19452&itemtype=291', id: 19452},
					{data: 'id=19532&itemtype=291', id: 19532},
					{data: 'id=19972&itemtype=291', id: 19972},
					{data: 'id=20007&itemtype=291', id: 20007},
					{data: 'id=20524&itemtype=291', id: 20524},
					{data: 'id=21036&itemtype=291', id: 21036},
					{data: 'id=21432&itemtype=291', id: 21432},
					{data: 'id=21435&itemtype=291', id: 21435},
					{data: 'id=21440&itemtype=291', id: 21440},
					{data: 'id=21443&itemtype=291', id: 21443},
					{data: 'id=21446&itemtype=291', id: 21446},
					{data: 'id=21449&itemtype=291', id: 21449},
					{data: 'id=21452&itemtype=291', id: 21452},
					{data: 'id=21599&itemtype=291', id: 21599},
					{data: 'id=21654&itemtype=291', id: 21654},
					{data: 'id=21673&itemtype=291', id: 21673},
					{data: 'id=22511&itemtype=291', id: 22511},
					{data: 'id=28404&itemtype=291', id: 28404},
					{data: 'id=28405&itemtype=291', id: 28405},
					{data: 'id=28406&itemtype=291', id: 28406},
					{data: 'id=28407&itemtype=291', id: 28407},
					{data: 'id=28408&itemtype=291', id: 28408},
					{data: 'id=28409&itemtype=291', id: 28409},
					{data: 'id=28410&itemtype=291', id: 28410},
					{data: 'id=28411&itemtype=291', id: 28411},
					{data: 'id=28412&itemtype=291', id: 28412},
					{data: 'id=28413&itemtype=291', id: 28413},
					{data: 'id=93739&itemtype=291', id: 93739},
					{data: 'id=96690&itemtype=291', id: 96690},
					{data: 'id=99223&itemtype=291', id: 99223},
					{data: 'id=100298&itemtype=291', id: 100298},
					{data: 'id=100302&itemtype=291', id: 100302},
					{data: 'id=102021&itemtype=291', id: 102021},
					{data: 'id=103451&itemtype=291', id: 103451},
					{data: 'id=104581&itemtype=291', id: 104581},
					{data: 'id=107183&itemtype=291', id: 107183},
					{data: 'id=107304&itemtype=291', id: 107304},
					{data: 'id=107452&itemtype=291', id: 107452},
					{data: 'id=108824&itemtype=291', id: 108824},
					{data: 'id=109288&itemtype=291', id: 109288},
					{data: 'id=110786&itemtype=291', id: 110786},
					{data: 'id=112353&itemtype=291', id: 112353},
					{data: 'id=113226&itemtype=291', id: 113226},
					{data: 'id=114344&itemtype=291', id: 114344},
					{data: 'id=114774&itemtype=291', id: 114774},
					{data: 'id=118470&itemtype=291', id: 118470},
					{data: 'id=118994&itemtype=291', id: 118994},
					{data: 'id=119230&itemtype=291', id: 119230},
					{data: 'id=104895&itemtype=298', id: 104895},
					{data: 'id=108123&itemtype=298', id: 108123},
					{data: 'id=108128&itemtype=298', id: 108128},
					{data: 'id=117032&itemtype=298', id: 117032},
					{data: 'id=3690&itemtype=303', id: 3690},
					{data: 'id=5878&itemtype=303', id: 5878},
					{data: 'id=8079&itemtype=303', id: 8079},
					{data: 'id=15007&itemtype=303', id: 15007},
					{data: 'id=15010&itemtype=303', id: 15010},
					{data: 'id=15048&itemtype=303', id: 15048},
					{data: 'id=15266&itemtype=303', id: 15266},
					{data: 'id=15335&itemtype=303', id: 15335},
					{data: 'id=15521&itemtype=303', id: 15521},
					{data: 'id=15525&itemtype=303', id: 15525},
					{data: 'id=15553&itemtype=303', id: 15553},
					{data: 'id=16045&itemtype=303', id: 16045},
					{data: 'id=16118&itemtype=303', id: 16118},
					{data: 'id=16308&itemtype=303', id: 16308},
					{data: 'id=16373&itemtype=303', id: 16373},
					{data: 'id=16376&itemtype=303', id: 16376},
					{data: 'id=16745&itemtype=303', id: 16745},
					{data: 'id=16751&itemtype=303', id: 16751},
					{data: 'id=16754&itemtype=303', id: 16754},
					{data: 'id=17025&itemtype=303', id: 17025},
					{data: 'id=17108&itemtype=303', id: 17108},
					{data: 'id=17253&itemtype=303', id: 17253},
					{data: 'id=17410&itemtype=303', id: 17410},
					{data: 'id=17445&itemtype=303', id: 17445},
					{data: 'id=17450&itemtype=303', id: 17450},
					{data: 'id=17466&itemtype=303', id: 17466},
					{data: 'id=17467&itemtype=303', id: 17467},
					{data: 'id=17474&itemtype=303', id: 17474},
					{data: 'id=17563&itemtype=303', id: 17563},
					{data: 'id=19506&itemtype=303', id: 19506},
					{data: 'id=19510&itemtype=303', id: 19510},
					{data: 'id=19597&itemtype=303', id: 19597},
					{data: 'id=19763&itemtype=303', id: 19763},
					{data: 'id=19948&itemtype=303', id: 19948},
					{data: 'id=20060&itemtype=303', id: 20060},
					{data: 'id=20364&itemtype=303', id: 20364},
					{data: 'id=20436&itemtype=303', id: 20436},
					{data: 'id=20542&itemtype=303', id: 20542},
					{data: 'id=20632&itemtype=303', id: 20632},
					{data: 'id=20789&itemtype=303', id: 20789},
					{data: 'id=20826&itemtype=303', id: 20826},
					{data: 'id=20859&itemtype=303', id: 20859},
					{data: 'id=20921&itemtype=303', id: 20921},
					{data: 'id=20934&itemtype=303', id: 20934},
					{data: 'id=21013&itemtype=303', id: 21013},
					{data: 'id=21173&itemtype=303', id: 21173},
					{data: 'id=21517&itemtype=303', id: 21517},
					{data: 'id=21844&itemtype=303', id: 21844},
					{data: 'id=21863&itemtype=303', id: 21863},
					{data: 'id=26852&itemtype=303', id: 26852},
					{data: 'id=27308&itemtype=303', id: 27308},
					{data: 'id=27409&itemtype=303', id: 27409},
					{data: 'id=27524&itemtype=303', id: 27524},
					{data: 'id=27631&itemtype=303', id: 27631},
					{data: 'id=27701&itemtype=303', id: 27701},
					{data: 'id=27762&itemtype=303', id: 27762},
					{data: 'id=27845&itemtype=303', id: 27845},
					{data: 'id=29169&itemtype=303', id: 29169},
					{data: 'id=95455&itemtype=303', id: 95455},
					{data: 'id=95553&itemtype=303', id: 95553},
					{data: 'id=98959&itemtype=303', id: 98959},
					{data: 'id=100450&itemtype=303', id: 100450},
					{data: 'id=100474&itemtype=303', id: 100474},
					{data: 'id=100664&itemtype=303', id: 100664},
					{data: 'id=100734&itemtype=303', id: 100734},
					{data: 'id=100977&itemtype=303', id: 100977},
					{data: 'id=102400&itemtype=303', id: 102400},
					{data: 'id=102456&itemtype=303', id: 102456},
					{data: 'id=102753&itemtype=303', id: 102753},
					{data: 'id=102811&itemtype=303', id: 102811},
					{data: 'id=102822&itemtype=303', id: 102822},
					{data: 'id=102916&itemtype=303', id: 102916},
					{data: 'id=103031&itemtype=303', id: 103031},
					{data: 'id=103207&itemtype=303', id: 103207},
					{data: 'id=103437&itemtype=303', id: 103437},
					{data: 'id=104537&itemtype=303', id: 104537},
					{data: 'id=104550&itemtype=303', id: 104550},
					{data: 'id=104560&itemtype=303', id: 104560},
					{data: 'id=104563&itemtype=303', id: 104563},
					{data: 'id=104703&itemtype=303', id: 104703},
					{data: 'id=104705&itemtype=303', id: 104705},
					{data: 'id=104723&itemtype=303', id: 104723},
					{data: 'id=104734&itemtype=303', id: 104734},
					{data: 'id=105187&itemtype=303', id: 105187},
					{data: 'id=105373&itemtype=303', id: 105373},
					{data: 'id=105377&itemtype=303', id: 105377},
					{data: 'id=105440&itemtype=303', id: 105440},
					{data: 'id=105850&itemtype=303', id: 105850},
					{data: 'id=105852&itemtype=303', id: 105852},
					{data: 'id=105980&itemtype=303', id: 105980},
					{data: 'id=106104&itemtype=303', id: 106104},
					{data: 'id=106113&itemtype=303', id: 106113},
					{data: 'id=106369&itemtype=303', id: 106369},
					{data: 'id=106397&itemtype=303', id: 106397},
					{data: 'id=106406&itemtype=303', id: 106406},
					{data: 'id=106412&itemtype=303', id: 106412},
					{data: 'id=106520&itemtype=303', id: 106520},
					{data: 'id=107041&itemtype=303', id: 107041},
					{data: 'id=107159&itemtype=303', id: 107159},
					{data: 'id=107192&itemtype=303', id: 107192},
					{data: 'id=107629&itemtype=303', id: 107629},
					{data: 'id=107837&itemtype=303', id: 107837},
					{data: 'id=107860&itemtype=303', id: 107860},
					{data: 'id=107899&itemtype=303', id: 107899},
					{data: 'id=108041&itemtype=303', id: 108041},
					{data: 'id=108108&itemtype=303', id: 108108},
					{data: 'id=108124&itemtype=303', id: 108124},
					{data: 'id=108465&itemtype=303', id: 108465},
					{data: 'id=108904&itemtype=303', id: 108904},
					{data: 'id=110736&itemtype=303', id: 110736},
					{data: 'id=112046&itemtype=303', id: 112046},
					{data: 'id=113391&itemtype=303', id: 113391},
					{data: 'id=114043&itemtype=303', id: 114043},
					{data: 'id=114647&itemtype=303', id: 114647},
					{data: 'id=115212&itemtype=303', id: 115212},
					{data: 'id=115970&itemtype=303', id: 115970},
					{data: 'id=115987&itemtype=303', id: 115987},
					{data: 'id=116714&itemtype=303', id: 116714},
					{data: 'id=116998&itemtype=303', id: 116998},
					{data: 'id=117033&itemtype=303', id: 117033},
					{data: 'id=117298&itemtype=303', id: 117298},
					{data: 'id=117315&itemtype=303', id: 117315},
					{data: 'id=119090&itemtype=303', id: 119090},
					{data: 'id=119331&itemtype=303', id: 119331},
					{data: 'id=18167&itemtype=291', id: 18167},
					{data: 'id=18175&itemtype=291', id: 18175},
					{data: 'id=18183&itemtype=291', id: 18183},
					{data: 'id=20603&itemtype=291', id: 20603},
					{data: 'id=105050&itemtype=291', id: 105050},
					{data: 'id=16277&itemtype=311', id: 16277},
					{data: 'id=16588&itemtype=313', id: 16588},
					{data: 'id=16839&itemtype=313', id: 16839},
					{data: 'id=17203&itemtype=313', id: 17203},
					{data: 'id=17725&itemtype=313', id: 17725},
					{data: 'id=17745&itemtype=313', id: 17745},
					{data: 'id=19041&itemtype=313', id: 19041},
					{data: 'id=19147&itemtype=313', id: 19147},
					{data: 'id=19154&itemtype=313', id: 19154},
					{data: 'id=19157&itemtype=313', id: 19157},
					{data: 'id=19385&itemtype=313', id: 19385},
					{data: 'id=19651&itemtype=313', id: 19651},
					{data: 'id=19657&itemtype=313', id: 19657},
					{data: 'id=19691&itemtype=313', id: 19691},
					{data: 'id=19704&itemtype=313', id: 19704},
					{data: 'id=20797&itemtype=313', id: 20797},
					{data: 'id=20832&itemtype=313', id: 20832},
					{data: 'id=21040&itemtype=313', id: 21040},
					{data: 'id=21041&itemtype=313', id: 21041},
					{data: 'id=21042&itemtype=313', id: 21042},
					{data: 'id=21043&itemtype=313', id: 21043},
					{data: 'id=21044&itemtype=313', id: 21044},
					{data: 'id=21045&itemtype=313', id: 21045},
					{data: 'id=21174&itemtype=313', id: 21174},
					{data: 'id=21271&itemtype=313', id: 21271},
					{data: 'id=21273&itemtype=313', id: 21273},
					{data: 'id=22488&itemtype=313', id: 22488},
					{data: 'id=96466&itemtype=313', id: 96466},
					{data: 'id=98120&itemtype=313', id: 98120},
					{data: 'id=103867&itemtype=313', id: 103867},
					{data: 'id=106569&itemtype=313', id: 106569},
					{data: 'id=108695&itemtype=313', id: 108695},
					{data: 'id=114818&itemtype=313', id: 114818},
					{data: 'id=114959&itemtype=313', id: 114959},
					{data: 'id=11268&itemtype=325', id: 11268},
					{data: 'id=11744&itemtype=325', id: 11744},
					{data: 'id=15982&itemtype=325', id: 15982},
					{data: 'id=16126&itemtype=325', id: 16126},
					{data: 'id=16217&itemtype=325', id: 16217},
					{data: 'id=19480&itemtype=325', id: 19480},
					{data: 'id=20770&itemtype=325', id: 20770},
					{data: 'id=20935&itemtype=325', id: 20935},
					{data: 'id=21016&itemtype=325', id: 21016},
					{data: 'id=28279&itemtype=325', id: 28279},
					{data: 'id=94690&itemtype=325', id: 94690},
					{data: 'id=97928&itemtype=325', id: 97928},
					{data: 'id=103635&itemtype=325', id: 103635},
					{data: 'id=104735&itemtype=325', id: 104735},
					{data: 'id=106105&itemtype=325', id: 106105},
					{data: 'id=106114&itemtype=325', id: 106114},
					{data: 'id=106398&itemtype=325', id: 106398},
					{data: 'id=106407&itemtype=325', id: 106407},
					{data: 'id=106413&itemtype=325', id: 106413},
					{data: 'id=108102&itemtype=325', id: 108102},
					{data: 'id=109119&itemtype=325', id: 109119},
					{data: 'id=109518&itemtype=325', id: 109518},
					{data: 'id=111550&itemtype=325', id: 111550},
					{data: 'id=113549&itemtype=325', id: 113549},
					{data: 'id=113808&itemtype=325', id: 113808},
					{data: 'id=12358&itemtype=341', id: 12358},
					{data: 'id=16589&itemtype=341', id: 16589},
					{data: 'id=17627&itemtype=341', id: 17627},
					{data: 'id=17726&itemtype=341', id: 17726},
					{data: 'id=17746&itemtype=341', id: 17746},
					{data: 'id=19498&itemtype=341', id: 19498},
					{data: 'id=20628&itemtype=341', id: 20628},
					{data: 'id=20798&itemtype=341', id: 20798},
					{data: 'id=21274&itemtype=341', id: 21274},
					{data: 'id=21727&itemtype=341', id: 21727},
					{data: 'id=22489&itemtype=341', id: 22489},
					{data: 'id=99183&itemtype=341', id: 99183},
					{data: 'id=99435&itemtype=341', id: 99435},
					{data: 'id=115841&itemtype=341', id: 115841},
					{data: 'id=766&itemtype=368', id: 766},
					{data: 'id=1017&itemtype=368', id: 1017},
					{data: 'id=3151&itemtype=368', id: 3151},
					{data: 'id=3739&itemtype=368', id: 3739},
					{data: 'id=5433&itemtype=368', id: 5433},
					{data: 'id=5923&itemtype=368', id: 5923},
					{data: 'id=6122&itemtype=368', id: 6122},
					{data: 'id=6612&itemtype=368', id: 6612},
					{data: 'id=6769&itemtype=368', id: 6769},
					{data: 'id=6935&itemtype=368', id: 6935},
					{data: 'id=7843&itemtype=368', id: 7843},
					{data: 'id=8126&itemtype=368', id: 8126},
					{data: 'id=8370&itemtype=368', id: 8370},
					{data: 'id=8525&itemtype=368', id: 8525},
					{data: 'id=8681&itemtype=368', id: 8681},
					{data: 'id=8853&itemtype=368', id: 8853},
					{data: 'id=9297&itemtype=368', id: 9297},
					{data: 'id=9414&itemtype=368', id: 9414},
					{data: 'id=9558&itemtype=368', id: 9558},
					{data: 'id=9695&itemtype=368', id: 9695},
					{data: 'id=10838&itemtype=368', id: 10838},
					{data: 'id=11000&itemtype=368', id: 11000},
					{data: 'id=11300&itemtype=368', id: 11300},
					{data: 'id=11427&itemtype=368', id: 11427},
					{data: 'id=11606&itemtype=368', id: 11606},
					{data: 'id=11778&itemtype=368', id: 11778},
					{data: 'id=12858&itemtype=368', id: 12858},
					{data: 'id=13002&itemtype=368', id: 13002},
					{data: 'id=13130&itemtype=368', id: 13130},
					{data: 'id=13307&itemtype=368', id: 13307},
					{data: 'id=13475&itemtype=368', id: 13475},
					{data: 'id=13617&itemtype=368', id: 13617},
					{data: 'id=14125&itemtype=368', id: 14125},
					{data: 'id=14406&itemtype=368', id: 14406},
					{data: 'id=14868&itemtype=368', id: 14868},
					{data: 'id=89542&itemtype=368', id: 89542},
					{data: 'id=93011&itemtype=368', id: 93011},
					{data: 'id=93628&itemtype=368', id: 93628},
					{data: 'id=95179&itemtype=368', id: 95179},
					{data: 'id=99978&itemtype=368', id: 99978},
					{data: 'id=100089&itemtype=368', id: 100089},
					{data: 'id=101653&itemtype=368', id: 101653},
					{data: 'id=103376&itemtype=368', id: 103376},
					{data: 'id=104941&itemtype=368', id: 104941},
					{data: 'id=108219&itemtype=368', id: 108219},
					{data: 'id=108573&itemtype=368', id: 108573},
					{data: 'id=109068&itemtype=368', id: 109068},
					{data: 'id=109449&itemtype=368', id: 109449},
					{data: 'id=109966&itemtype=368', id: 109966},
					{data: 'id=110164&itemtype=368', id: 110164},
					{data: 'id=111896&itemtype=368', id: 111896},
					{data: 'id=111922&itemtype=368', id: 111922},
					{data: 'id=113694&itemtype=368', id: 113694},
					{data: 'id=113999&itemtype=368', id: 113999},
					{data: 'id=114300&itemtype=368', id: 114300},
					{data: 'id=117920&itemtype=368', id: 117920},
					{data: 'id=117933&itemtype=368', id: 117933},
					{data: 'id=11607&itemtype=371', id: 11607},
					{data: 'id=1360&itemtype=371', id: 1360},
					{data: 'id=19200&itemtype=371', id: 19200},
					{data: 'id=19380&itemtype=371', id: 19380},
					{data: 'id=20131&itemtype=371', id: 20131},
					{data: 'id=89798&itemtype=371', id: 89798},
					{data: 'id=93496&itemtype=371', id: 93496},
					{data: 'id=93498&itemtype=371', id: 93498},
					{data: 'id=94953&itemtype=371', id: 94953},
					{data: 'id=11611&itemtype=379', id: 11611},
					{data: 'id=101660&itemtype=379', id: 101660},
					{data: 'id=767&itemtype=384', id: 767},
					{data: 'id=11782&itemtype=384', id: 11782},
					{data: 'id=19003&itemtype=384', id: 19003},
					{data: 'id=94879&itemtype=384', id: 94879},
					{data: 'id=16851&itemtype=377', id: 16851},
					{data: 'id=19513&itemtype=377', id: 19513},
					{data: 'id=106505&itemtype=377', id: 106505},
					{data: 'id=11798&itemtype=431', id: 11798},
					{data: 'id=13019&itemtype=431', id: 13019},
					{data: 'id=16787&itemtype=431', id: 16787},
					{data: 'id=17498&itemtype=431', id: 17498},
					{data: 'id=18989&itemtype=431', id: 18989},
					{data: 'id=19036&itemtype=431', id: 19036},
					{data: 'id=19753&itemtype=431', id: 19753},
					{data: 'id=19804&itemtype=431', id: 19804},
					{data: 'id=19821&itemtype=431', id: 19821},
					{data: 'id=95621&itemtype=431', id: 95621},
					{data: 'id=95843&itemtype=431', id: 95843},
					{data: 'id=97800&itemtype=431', id: 97800},
					{data: 'id=99288&itemtype=431', id: 99288},
					{data: 'id=99456&itemtype=431', id: 99456},
					{data: 'id=99611&itemtype=431', id: 99611},
					{data: 'id=100307&itemtype=431', id: 100307},
					{data: 'id=101065&itemtype=431', id: 101065},
					{data: 'id=101255&itemtype=431', id: 101255},
					{data: 'id=102564&itemtype=431', id: 102564},
					{data: 'id=102646&itemtype=431', id: 102646},
					{data: 'id=102980&itemtype=431', id: 102980},
					{data: 'id=103716&itemtype=431', id: 103716},
					{data: 'id=105094&itemtype=431', id: 105094},
					{data: 'id=110403&itemtype=431', id: 110403},
					{data: 'id=110820&itemtype=431', id: 110820},
					{data: 'id=111672&itemtype=431', id: 111672},
					{data: 'id=113119&itemtype=431', id: 113119},
					{data: 'id=114171&itemtype=431', id: 114171},
					{data: 'id=114575&itemtype=431', id: 114575},
					{data: 'id=114581&itemtype=431', id: 114581},
					{data: 'id=115303&itemtype=431', id: 115303},
					{data: 'id=115506&itemtype=431', id: 115506},
					{data: 'id=115849&itemtype=431', id: 115849},
					{data: 'id=116618&itemtype=431', id: 116618},
					{data: 'id=117351&itemtype=431', id: 117351},
					{data: 'id=117413&itemtype=431', id: 117413},
					{data: 'id=118762&itemtype=431', id: 118762},
					{data: 'id=118843&itemtype=431', id: 118843},
					{data: 'id=1397&itemtype=451', id: 1397},
					{data: 'id=5456&itemtype=451', id: 5456},
					{data: 'id=14175&itemtype=451', id: 14175},
					{data: 'id=14893&itemtype=451', id: 14893},
					{data: 'id=15018&itemtype=451', id: 15018},
					{data: 'id=17368&itemtype=451', id: 17368},
					{data: 'id=17565&itemtype=451', id: 17565},
					{data: 'id=17775&itemtype=451', id: 17775},
					{data: 'id=18264&itemtype=451', id: 18264},
					{data: 'id=18315&itemtype=451', id: 18315},
					{data: 'id=18323&itemtype=451', id: 18323},
					{data: 'id=18552&itemtype=451', id: 18552},
					{data: 'id=18554&itemtype=451', id: 18554},
					{data: 'id=18556&itemtype=451', id: 18556},
					{data: 'id=18561&itemtype=451', id: 18561},
					{data: 'id=18607&itemtype=451', id: 18607},
					{data: 'id=18638&itemtype=451', id: 18638},
					{data: 'id=18641&itemtype=451', id: 18641},
					{data: 'id=18647&itemtype=451', id: 18647},
					{data: 'id=18678&itemtype=451', id: 18678},
					{data: 'id=18684&itemtype=451', id: 18684},
					{data: 'id=18689&itemtype=451', id: 18689},
					{data: 'id=18695&itemtype=451', id: 18695},
					{data: 'id=18701&itemtype=451', id: 18701},
					{data: 'id=18707&itemtype=451', id: 18707},
					{data: 'id=18713&itemtype=451', id: 18713},
					{data: 'id=18719&itemtype=451', id: 18719},
					{data: 'id=18725&itemtype=451', id: 18725},
					{data: 'id=18731&itemtype=451', id: 18731},
					{data: 'id=18737&itemtype=451', id: 18737},
					{data: 'id=18743&itemtype=451', id: 18743},
					{data: 'id=18749&itemtype=451', id: 18749},
					{data: 'id=18755&itemtype=451', id: 18755},
					{data: 'id=18761&itemtype=451', id: 18761},
					{data: 'id=18767&itemtype=451', id: 18767},
					{data: 'id=18773&itemtype=451', id: 18773},
					{data: 'id=18781&itemtype=451', id: 18781},
					{data: 'id=18786&itemtype=451', id: 18786},
					{data: 'id=18792&itemtype=451', id: 18792},
					{data: 'id=18798&itemtype=451', id: 18798},
					{data: 'id=18804&itemtype=451', id: 18804},
					{data: 'id=18809&itemtype=451', id: 18809},
					{data: 'id=18815&itemtype=451', id: 18815},
					{data: 'id=18820&itemtype=451', id: 18820},
					{data: 'id=18828&itemtype=451', id: 18828},
					{data: 'id=18902&itemtype=451', id: 18902},
					{data: 'id=19023&itemtype=451', id: 19023},
					{data: 'id=19037&itemtype=451', id: 19037},
					{data: 'id=19048&itemtype=451', id: 19048},
					{data: 'id=19065&itemtype=451', id: 19065},
					{data: 'id=19071&itemtype=451', id: 19071},
					{data: 'id=19141&itemtype=451', id: 19141},
					{data: 'id=19201&itemtype=451', id: 19201},
					{data: 'id=19248&itemtype=451', id: 19248},
					{data: 'id=19277&itemtype=451', id: 19277},
					{data: 'id=19304&itemtype=451', id: 19304},
					{data: 'id=19323&itemtype=451', id: 19323},
					{data: 'id=19325&itemtype=451', id: 19325},
					{data: 'id=19394&itemtype=451', id: 19394},
					{data: 'id=19425&itemtype=451', id: 19425},
					{data: 'id=19432&itemtype=451', id: 19432},
					{data: 'id=19466&itemtype=451', id: 19466},
					{data: 'id=19489&itemtype=451', id: 19489},
					{data: 'id=19520&itemtype=451', id: 19520},
					{data: 'id=19542&itemtype=451', id: 19542},
					{data: 'id=19620&itemtype=451', id: 19620},
					{data: 'id=19632&itemtype=451', id: 19632},
					{data: 'id=19680&itemtype=451', id: 19680},
					{data: 'id=19701&itemtype=451', id: 19701},
					{data: 'id=19720&itemtype=451', id: 19720},
					{data: 'id=19744&itemtype=451', id: 19744},
					{data: 'id=19756&itemtype=451', id: 19756},
					{data: 'id=19758&itemtype=451', id: 19758},
					{data: 'id=19816&itemtype=451', id: 19816},
					{data: 'id=19843&itemtype=451', id: 19843},
					{data: 'id=19880&itemtype=451', id: 19880},
					{data: 'id=19892&itemtype=451', id: 19892},
					{data: 'id=20113&itemtype=451', id: 20113},
					{data: 'id=20263&itemtype=451', id: 20263},
					{data: 'id=20370&itemtype=451', id: 20370},
					{data: 'id=20371&itemtype=451', id: 20371},
					{data: 'id=20372&itemtype=451', id: 20372},
					{data: 'id=20388&itemtype=451', id: 20388},
					{data: 'id=20520&itemtype=451', id: 20520},
					{data: 'id=20584&itemtype=451', id: 20584},
					{data: 'id=20587&itemtype=451', id: 20587},
					{data: 'id=20594&itemtype=451', id: 20594},
					{data: 'id=20622&itemtype=451', id: 20622},
					{data: 'id=21089&itemtype=451', id: 21089},
					{data: 'id=21099&itemtype=451', id: 21099},
					{data: 'id=21340&itemtype=451', id: 21340},
					{data: 'id=21343&itemtype=451', id: 21343},
					{data: 'id=21346&itemtype=451', id: 21346},
					{data: 'id=21349&itemtype=451', id: 21349},
					{data: 'id=21420&itemtype=451', id: 21420},
					{data: 'id=21473&itemtype=451', id: 21473},
					{data: 'id=21604&itemtype=451', id: 21604},
					{data: 'id=21624&itemtype=451', id: 21624},
					{data: 'id=21732&itemtype=451', id: 21732},
					{data: 'id=21800&itemtype=451', id: 21800},
					{data: 'id=28059&itemtype=451', id: 28059},
					{data: 'id=28298&itemtype=451', id: 28298},
					{data: 'id=94062&itemtype=451', id: 94062},
					{data: 'id=94379&itemtype=451', id: 94379},
					{data: 'id=94733&itemtype=451', id: 94733},
					{data: 'id=95421&itemtype=451', id: 95421},
					{data: 'id=96018&itemtype=451', id: 96018},
					{data: 'id=96337&itemtype=451', id: 96337},
					{data: 'id=98193&itemtype=451', id: 98193},
					{data: 'id=99013&itemtype=451', id: 99013},
					{data: 'id=99141&itemtype=451', id: 99141},
					{data: 'id=101272&itemtype=451', id: 101272},
					{data: 'id=102809&itemtype=451', id: 102809},
					{data: 'id=103611&itemtype=451', id: 103611},
					{data: 'id=103808&itemtype=451', id: 103808},
					{data: 'id=106632&itemtype=451', id: 106632},
					{data: 'id=106894&itemtype=451', id: 106894},
					{data: 'id=107235&itemtype=451', id: 107235},
					{data: 'id=108673&itemtype=451', id: 108673},
					{data: 'id=110623&itemtype=451', id: 110623},
					{data: 'id=112525&itemtype=451', id: 112525},
					{data: 'id=112719&itemtype=451', id: 112719},
					{data: 'id=112950&itemtype=451', id: 112950},
					{data: 'id=113213&itemtype=451', id: 113213},
					{data: 'id=114023&itemtype=451', id: 114023},
					{data: 'id=115162&itemtype=451', id: 115162},
					{data: 'id=115233&itemtype=451', id: 115233},
					{data: 'id=115942&itemtype=451', id: 115942},
					{data: 'id=116078&itemtype=451', id: 116078},
					{data: 'id=116837&itemtype=451', id: 116837},
					{data: 'id=118230&itemtype=451', id: 118230},
					{data: 'id=6159&itemtype=457', id: 6159},
					{data: 'id=7706&itemtype=457', id: 7706},
					{data: 'id=8180&itemtype=457', id: 8180},
					{data: 'id=19840&itemtype=457', id: 19840},
					{data: 'id=1618&itemtype=455', id: 1618},
					{data: 'id=2078&itemtype=455', id: 2078},
					{data: 'id=2453&itemtype=455', id: 2453},
					{data: 'id=3529&itemtype=455', id: 3529},
					{data: 'id=4902&itemtype=455', id: 4902},
					{data: 'id=5258&itemtype=455', id: 5258},
					{data: 'id=5760&itemtype=455', id: 5760},
					{data: 'id=6486&itemtype=455', id: 6486},
					{data: 'id=7278&itemtype=455', id: 7278},
					{data: 'id=7708&itemtype=455', id: 7708},
					{data: 'id=9165&itemtype=455', id: 9165},
					{data: 'id=10162&itemtype=455', id: 10162},
					{data: 'id=10683&itemtype=455', id: 10683},
					{data: 'id=11639&itemtype=455', id: 11639},
					{data: 'id=12678&itemtype=455', id: 12678},
					{data: 'id=13940&itemtype=455', id: 13940},
					{data: 'id=14740&itemtype=455', id: 14740},
					{data: 'id=7328&itemtype=481', id: 7328}
				];


				oParam.updateRows2 =
				[
					{data: 'id=119865&remove=1', action: 'remove', id: 119865},
					{data: 'id=119866&remove=1', action: 'remove', id: 119866},
					{data: 'id=119867&remove=1', action: 'remove', id: 119867},
					{data: 'id=119868&remove=1', action: 'remove', id: 119868},
					{data: 'id=119869&remove=1', action: 'remove', id: 119869},
					{data: 'id=119870&remove=1', action: 'remove', id: 119870},
					{data: 'id=119871&remove=1', action: 'remove', id: 119871},
					{data: 'id=119872&remove=1', action: 'remove', id: 119872},
					{data: 'id=119873&remove=1', action: 'remove', id: 119873},
					{data: 'id=119874&remove=1', action: 'remove', id: 119874},
					{data: 'id=119875&remove=1', action: 'remove', id: 119875},
					{data: 'id=119876&remove=1', action: 'remove', id: 119876},
					{data: 'id=119877&remove=1', action: 'remove', id: 119877},
					{data: 'id=119878&remove=1', action: 'remove', id: 119878},
					{data: 'id=119879&remove=1', action: 'remove', id: 119879},
					{data: 'id=119880&remove=1', action: 'remove', id: 119880},
					{data: 'id=119881&remove=1', action: 'remove', id: 119881},
					{data: 'id=119882&remove=1', action: 'remove', id: 119882},
					{data: 'id=119883&remove=1', action: 'remove', id: 119883},
					{data: 'id=119884&remove=1', action: 'remove', id: 119884},
					{data: 'id=119885&remove=1', action: 'remove', id: 119885},
					{data: 'id=119886&remove=1', action: 'remove', id: 119886},
					{data: 'id=119887&remove=1', action: 'remove', id: 119887},
					{data: 'id=119888&remove=1', action: 'remove', id: 119888},
					{data: 'id=119889&remove=1', action: 'remove', id: 119889},
					{data: 'id=119890&remove=1', action: 'remove', id: 119890},
					{data: 'id=119891&remove=1', action: 'remove', id: 119891},
					{data: 'id=119892&remove=1', action: 'remove', id: 119892},
					{data: 'id=119893&remove=1', action: 'remove', id: 119893},
					{data: 'id=119894&remove=1', action: 'remove', id: 119894},
					{data: 'id=119895&remove=1', action: 'remove', id: 119895},
					{data: 'id=119896&remove=1', action: 'remove', id: 119896},
					{data: 'id=119897&remove=1', action: 'remove', id: 119897},
					{data: 'id=119898&remove=1', action: 'remove', id: 119898},
					{data: 'id=119899&remove=1', action: 'remove', id: 119899},
					{data: 'id=119900&remove=1', action: 'remove', id: 119900},
					{data: 'id=119901&remove=1', action: 'remove', id: 119901},
					{data: 'id=119902&remove=1', action: 'remove', id: 119902},
					{data: 'id=119903&remove=1', action: 'remove', id: 119903},
					{data: 'id=119904&remove=1', action: 'remove', id: 119904},
					{data: 'id=119905&remove=1', action: 'remove', id: 119905},
					{data: 'id=119906&remove=1', action: 'remove', id: 119906},
					{data: 'id=119907&remove=1', action: 'remove', id: 119907},
					{data: 'id=119908&remove=1', action: 'remove', id: 119908},
					{data: 'id=119909&remove=1', action: 'remove', id: 119909},
					{data: 'id=119910&remove=1', action: 'remove', id: 119910},
					{data: 'id=119911&remove=1', action: 'remove', id: 119911},
					{data: 'id=119912&remove=1', action: 'remove', id: 119912},
					{data: 'id=119913&remove=1', action: 'remove', id: 119913},
					{data: 'id=119914&remove=1', action: 'remove', id: 119914},
					{data: 'id=119915&remove=1', action: 'remove', id: 119915},
					{data: 'id=119916&remove=1', action: 'remove', id: 119916},
					{data: 'id=119917&remove=1', action: 'remove', id: 119917},
					{data: 'id=119918&remove=1', action: 'remove', id: 119918},
					{data: 'id=119919&remove=1', action: 'remove', id: 119919},
					{data: 'id=119920&remove=1', action: 'remove', id: 119920},
					{data: 'id=119921&remove=1', action: 'remove', id: 119921},
					{data: 'id=119922&remove=1', action: 'remove', id: 119922},
					{data: 'id=119923&remove=1', action: 'remove', id: 119923},
					{data: 'id=119924&remove=1', action: 'remove', id: 119924},
					{data: 'id=119925&remove=1', action: 'remove', id: 119925},
					{data: 'id=119926&remove=1', action: 'remove', id: 119926},
					{data: 'id=119927&remove=1', action: 'remove', id: 119927},
					{data: 'id=119928&remove=1', action: 'remove', id: 119928},
					{data: 'id=119929&remove=1', action: 'remove', id: 119929},
					{data: 'id=119930&remove=1', action: 'remove', id: 119930},
					{data: 'id=119931&remove=1', action: 'remove', id: 119931},
					{data: 'id=119932&remove=1', action: 'remove', id: 119932},
					{data: 'id=119933&remove=1', action: 'remove', id: 119933},
					{data: 'id=119934&remove=1', action: 'remove', id: 119934},
					{data: 'id=119935&remove=1', action: 'remove', id: 119935},
					{data: 'id=119936&remove=1', action: 'remove', id: 119936},
					{data: 'id=119937&remove=1', action: 'remove', id: 119937},
					{data: 'id=119938&remove=1', action: 'remove', id: 119938},
					{data: 'id=119939&remove=1', action: 'remove', id: 119939},
					{data: 'id=119940&remove=1', action: 'remove', id: 119940},
					{data: 'id=119941&remove=1', action: 'remove', id: 119941},
					{data: 'id=27650&itemtype=53', action: 'update', id: 27650},
					{data: 'id=27652&itemtype=53', action: 'update', id: 27652},
					{data: 'id=119942&remove=1', action: 'remove', id: 119942},
					{data: 'id=119943&remove=1', action: 'remove', id: 119943},
					{data: 'id=119944&remove=1', action: 'remove', id: 119944},
					{data: 'id=119945&remove=1', action: 'remove', id: 119945},
					{data: 'id=119946&remove=1', action: 'remove', id: 119946},
					{data: 'id=119947&remove=1', action: 'remove', id: 119947},
					{data: 'id=119948&remove=1', action: 'remove', id: 119948},
					{data: 'id=119949&remove=1', action: 'remove', id: 119949},
					{data: 'id=119950&remove=1', action: 'remove', id: 119950},
					{data: 'id=119951&remove=1', action: 'remove', id: 119951},
					{data: 'id=119952&remove=1', action: 'remove', id: 119952},
					{data: 'id=119953&remove=1', action: 'remove', id: 119953},
					{data: 'id=119954&remove=1', action: 'remove', id: 119954},
					{data: 'id=119955&remove=1', action: 'remove', id: 119955},
					{data: 'id=119956&remove=1', action: 'remove', id: 119956},
					{data: 'id=119957&remove=1', action: 'remove', id: 119957},
					{data: 'id=119958&remove=1', action: 'remove', id: 119958},
					{data: 'id=119959&remove=1', action: 'remove', id: 119959},
					{data: 'id=119960&remove=1', action: 'remove', id: 119960},
					{data: 'id=119961&remove=1', action: 'remove', id: 119961},
					{data: 'id=119962&remove=1', action: 'remove', id: 119962},
					{data: 'id=119963&remove=1', action: 'remove', id: 119963},
					{data: 'id=119964&remove=1', action: 'remove', id: 119964},
					{data: 'id=119965&remove=1', action: 'remove', id: 119965},
					{data: 'id=119966&remove=1', action: 'remove', id: 119966},
					{data: 'id=119967&remove=1', action: 'remove', id: 119967},
					{data: 'id=119968&remove=1', action: 'remove', id: 119968},
					{data: 'id=27832&itemtype=53', action: 'update', id: 27832},
					{data: 'id=119969&remove=1', action: 'remove', id: 119969},
					{data: 'id=119970&remove=1', action: 'remove', id: 119970},
					{data: 'id=119971&remove=1', action: 'remove', id: 119971},
					{data: 'id=119972&remove=1', action: 'remove', id: 119972},
					{data: 'id=119973&remove=1', action: 'remove', id: 119973},
					{data: 'id=119974&remove=1', action: 'remove', id: 119974},
					{data: 'id=119975&remove=1', action: 'remove', id: 119975},
					{data: 'id=119976&remove=1', action: 'remove', id: 119976},
					{data: 'id=119977&remove=1', action: 'remove', id: 119977},
					{data: 'id=119978&remove=1', action: 'remove', id: 119978},
					{data: 'id=119979&remove=1', action: 'remove', id: 119979},
					{data: 'id=119980&remove=1', action: 'remove', id: 119980},
					{data: 'id=119981&remove=1', action: 'remove', id: 119981},
					{data: 'id=119982&remove=1', action: 'remove', id: 119982},
					{data: 'id=119983&remove=1', action: 'remove', id: 119983},
					{data: 'id=119984&remove=1', action: 'remove', id: 119984},
					{data: 'id=119985&remove=1', action: 'remove', id: 119985},
					{data: 'id=119986&remove=1', action: 'remove', id: 119986},
					{data: 'id=119987&remove=1', action: 'remove', id: 119987},
					{data: 'id=119988&remove=1', action: 'remove', id: 119988},
					{data: 'id=119989&remove=1', action: 'remove', id: 119989},
					{data: 'id=119990&remove=1', action: 'remove', id: 119990},
					{data: 'id=119991&remove=1', action: 'remove', id: 119991},
					{data: 'id=119992&remove=1', action: 'remove', id: 119992},
					{data: 'id=119993&remove=1', action: 'remove', id: 119993},
					{data: 'id=119994&remove=1', action: 'remove', id: 119994},
					{data: 'id=119995&remove=1', action: 'remove', id: 119995},
					{data: 'id=119996&remove=1', action: 'remove', id: 119996},
					{data: 'id=119997&remove=1', action: 'remove', id: 119997},
					{data: 'id=119998&remove=1', action: 'remove', id: 119998},
					{data: 'id=119999&remove=1', action: 'remove', id: 119999},
					{data: 'id=120000&remove=1', action: 'remove', id: 120000},
					{data: 'id=120001&remove=1', action: 'remove', id: 120001},
					{data: 'id=120002&remove=1', action: 'remove', id: 120002},
					{data: 'id=120003&remove=1', action: 'remove', id: 120003},
					{data: 'id=120004&remove=1', action: 'remove', id: 120004},
					{data: 'id=120005&remove=1', action: 'remove', id: 120005},
					{data: 'id=120006&remove=1', action: 'remove', id: 120006},
					{data: 'id=120007&remove=1', action: 'remove', id: 120007},
					{data: 'id=120008&remove=1', action: 'remove', id: 120008},
					{data: 'id=120009&remove=1', action: 'remove', id: 120009},
					{data: 'id=120010&remove=1', action: 'remove', id: 120010},
					{data: 'id=120011&remove=1', action: 'remove', id: 120011},
					{data: 'id=120012&remove=1', action: 'remove', id: 120012},
					{data: 'id=120013&remove=1', action: 'remove', id: 120013},
					{data: 'id=120014&remove=1', action: 'remove', id: 120014},
					{data: 'id=120015&remove=1', action: 'remove', id: 120015},
					{data: 'id=120016&remove=1', action: 'remove', id: 120016},
					{data: 'id=120017&remove=1', action: 'remove', id: 120017},
					{data: 'id=120018&remove=1', action: 'remove', id: 120018},
					{data: 'id=120019&remove=1', action: 'remove', id: 120019},
					{data: 'id=120020&remove=1', action: 'remove', id: 120020},
					{data: 'id=120021&remove=1', action: 'remove', id: 120021},
					{data: 'id=120022&remove=1', action: 'remove', id: 120022},
					{data: 'id=120023&remove=1', action: 'remove', id: 120023},
					{data: 'id=120024&remove=1', action: 'remove', id: 120024},
					{data: 'id=120025&remove=1', action: 'remove', id: 120025},
					{data: 'id=120026&remove=1', action: 'remove', id: 120026},
					{data: 'id=120027&remove=1', action: 'remove', id: 120027},
					{data: 'id=120028&remove=1', action: 'remove', id: 120028},
					{data: 'id=120029&remove=1', action: 'remove', id: 120029},
					{data: 'id=120030&remove=1', action: 'remove', id: 120030},
					{data: 'id=120031&remove=1', action: 'remove', id: 120031},
					{data: 'id=120032&remove=1', action: 'remove', id: 120032},
					{data: 'id=120033&remove=1', action: 'remove', id: 120033},
					{data: 'id=120034&remove=1', action: 'remove', id: 120034},
					{data: 'id=120035&remove=1', action: 'remove', id: 120035},
					{data: 'id=120036&remove=1', action: 'remove', id: 120036},
					{data: 'id=120037&remove=1', action: 'remove', id: 120037},
					{data: 'id=120038&remove=1', action: 'remove', id: 120038},
					{data: 'id=120039&remove=1', action: 'remove', id: 120039},
					{data: 'id=120040&remove=1', action: 'remove', id: 120040},
					{data: 'id=120041&remove=1', action: 'remove', id: 120041},
					{data: 'id=120042&remove=1', action: 'remove', id: 120042},
					{data: 'id=120043&remove=1', action: 'remove', id: 120043},
					{data: 'id=120044&remove=1', action: 'remove', id: 120044},
					{data: 'id=120045&remove=1', action: 'remove', id: 120045},
					{data: 'id=120046&remove=1', action: 'remove', id: 120046},
					{data: 'id=120047&remove=1', action: 'remove', id: 120047},
					{data: 'id=120048&remove=1', action: 'remove', id: 120048},
					{data: 'id=120049&remove=1', action: 'remove', id: 120049},
					{data: 'id=120050&remove=1', action: 'remove', id: 120050},
					{data: 'id=120051&remove=1', action: 'remove', id: 120051},
					{data: 'id=120052&remove=1', action: 'remove', id: 120052},
					{data: 'id=120053&remove=1', action: 'remove', id: 120053},
					{data: 'id=120054&remove=1', action: 'remove', id: 120054},
					{data: 'id=120055&remove=1', action: 'remove', id: 120055},
					{data: 'id=120056&remove=1', action: 'remove', id: 120056},
					{data: 'id=120057&remove=1', action: 'remove', id: 120057},
					{data: 'id=120058&remove=1', action: 'remove', id: 120058},
					{data: 'id=120059&remove=1', action: 'remove', id: 120059},
					{data: 'id=120060&remove=1', action: 'remove', id: 120060},
					{data: 'id=120061&remove=1', action: 'remove', id: 120061},
					{data: 'id=120062&remove=1', action: 'remove', id: 120062},
					{data: 'id=120063&remove=1', action: 'remove', id: 120063},
					{data: 'id=120064&remove=1', action: 'remove', id: 120064},
					{data: 'id=120065&remove=1', action: 'remove', id: 120065},
					{data: 'id=120066&remove=1', action: 'remove', id: 120066},
					{data: 'id=120067&remove=1', action: 'remove', id: 120067},
					{data: 'id=120068&remove=1', action: 'remove', id: 120068},
					{data: 'id=120069&remove=1', action: 'remove', id: 120069},
					{data: 'id=120070&remove=1', action: 'remove', id: 120070},
					{data: 'id=120071&remove=1', action: 'remove', id: 120071},
					{data: 'id=120072&remove=1', action: 'remove', id: 120072},
					{data: 'id=120073&remove=1', action: 'remove', id: 120073},
					{data: 'id=120074&remove=1', action: 'remove', id: 120074},
					{data: 'id=120075&remove=1', action: 'remove', id: 120075},
					{data: 'id=120076&remove=1', action: 'remove', id: 120076},
					{data: 'id=120077&remove=1', action: 'remove', id: 120077},
					{data: 'id=120078&remove=1', action: 'remove', id: 120078},
					{data: 'id=120079&remove=1', action: 'remove', id: 120079},
					{data: 'id=120080&remove=1', action: 'remove', id: 120080},
					{data: 'id=120081&remove=1', action: 'remove', id: 120081},
					{data: 'id=120082&remove=1', action: 'remove', id: 120082},
					{data: 'id=120083&remove=1', action: 'remove', id: 120083},
					{data: 'id=120084&remove=1', action: 'remove', id: 120084},
					{data: 'id=120085&remove=1', action: 'remove', id: 120085},
					{data: 'id=120086&remove=1', action: 'remove', id: 120086},
					{data: 'id=120087&remove=1', action: 'remove', id: 120087},
					{data: 'id=120088&remove=1', action: 'remove', id: 120088},
					{data: 'id=120089&remove=1', action: 'remove', id: 120089},
					{data: 'id=120090&remove=1', action: 'remove', id: 120090},
					{data: 'id=120091&remove=1', action: 'remove', id: 120091},
					{data: 'id=120092&remove=1', action: 'remove', id: 120092},
					{data: 'id=120093&remove=1', action: 'remove', id: 120093},
					{data: 'id=120094&remove=1', action: 'remove', id: 120094},
					{data: 'id=120095&remove=1', action: 'remove', id: 120095},
					{data: 'id=120096&remove=1', action: 'remove', id: 120096},
					{data: 'id=29175&itemtype=53', action: 'update', id: 29175},
					{data: 'id=120097&remove=1', action: 'remove', id: 120097},
					{data: 'id=120098&remove=1', action: 'remove', id: 120098},
					{data: 'id=120099&remove=1', action: 'remove', id: 120099},
					{data: 'id=120100&remove=1', action: 'remove', id: 120100},
					{data: 'id=120101&remove=1', action: 'remove', id: 120101},
					{data: 'id=120102&remove=1', action: 'remove', id: 120102},
					{data: 'id=120103&remove=1', action: 'remove', id: 120103},
					{data: 'id=120104&remove=1', action: 'remove', id: 120104},
					{data: 'id=120105&remove=1', action: 'remove', id: 120105},
					{data: 'id=120106&remove=1', action: 'remove', id: 120106},
					{data: 'id=120107&remove=1', action: 'remove', id: 120107},
					{data: 'id=120108&remove=1', action: 'remove', id: 120108},
					{data: 'id=120109&remove=1', action: 'remove', id: 120109},
					{data: 'id=120110&remove=1', action: 'remove', id: 120110},
					{data: 'id=120111&remove=1', action: 'remove', id: 120111},
					{data: 'id=120112&remove=1', action: 'remove', id: 120112},
					{data: 'id=120113&remove=1', action: 'remove', id: 120113},
					{data: 'id=120114&remove=1', action: 'remove', id: 120114},
					{data: 'id=120115&remove=1', action: 'remove', id: 120115},
					{data: 'id=120116&remove=1', action: 'remove', id: 120116},
					{data: 'id=120117&remove=1', action: 'remove', id: 120117},
					{data: 'id=120118&remove=1', action: 'remove', id: 120118},
					{data: 'id=120119&remove=1', action: 'remove', id: 120119},
					{data: 'id=120120&remove=1', action: 'remove', id: 120120},
					{data: 'id=120121&remove=1', action: 'remove', id: 120121},
					{data: 'id=120122&remove=1', action: 'remove', id: 120122},
					{data: 'id=120123&remove=1', action: 'remove', id: 120123},
					{data: 'id=120124&remove=1', action: 'remove', id: 120124},
					{data: 'id=120125&remove=1', action: 'remove', id: 120125},
					{data: 'id=120126&remove=1', action: 'remove', id: 120126},
					{data: 'id=120127&remove=1', action: 'remove', id: 120127},
					{data: 'id=120128&remove=1', action: 'remove', id: 120128},
					{data: 'id=120129&remove=1', action: 'remove', id: 120129},
					{data: 'id=120130&remove=1', action: 'remove', id: 120130},
					{data: 'id=120131&remove=1', action: 'remove', id: 120131},
					{data: 'id=120132&remove=1', action: 'remove', id: 120132},
					{data: 'id=120133&remove=1', action: 'remove', id: 120133},
					{data: 'id=120134&remove=1', action: 'remove', id: 120134},
					{data: 'id=120135&remove=1', action: 'remove', id: 120135},
					{data: 'id=120136&remove=1', action: 'remove', id: 120136},
					{data: 'id=120137&remove=1', action: 'remove', id: 120137},
					{data: 'id=120138&remove=1', action: 'remove', id: 120138},
					{data: 'id=120139&remove=1', action: 'remove', id: 120139},
					{data: 'id=120140&remove=1', action: 'remove', id: 120140},
					{data: 'id=120141&remove=1', action: 'remove', id: 120141},
					{data: 'id=120142&remove=1', action: 'remove', id: 120142},
					{data: 'id=120143&remove=1', action: 'remove', id: 120143},
					{data: 'id=120144&remove=1', action: 'remove', id: 120144},
					{data: 'id=120145&remove=1', action: 'remove', id: 120145},
					{data: 'id=85862&remove=1', action: 'remove', id: 85862},
					{data: 'id=85861&remove=1', action: 'remove', id: 85861},
					{data: 'id=29831&remove=1', action: 'remove', id: 29831},
					{data: 'id=85880&remove=1', action: 'remove', id: 85880},
					{data: 'id=29826&remove=1', action: 'remove', id: 29826},
					{data: 'id=85875&remove=1', action: 'remove', id: 85875},
					{data: 'id=29827&remove=1', action: 'remove', id: 29827},
					{data: 'id=85876&remove=1', action: 'remove', id: 85876},
					{data: 'id=29830&remove=1', action: 'remove', id: 29830},
					{data: 'id=85879&remove=1', action: 'remove', id: 85879},
					{data: 'id=29829&remove=1', action: 'remove', id: 29829},
					{data: 'id=85878&remove=1', action: 'remove', id: 85878},
					{data: 'id=29828&remove=1', action: 'remove', id: 29828},
					{data: 'id=85877&remove=1', action: 'remove', id: 85877},
					{data: 'id=29900&remove=1', action: 'remove', id: 29900},
					{data: 'id=85949&remove=1', action: 'remove', id: 85949},
					{data: 'id=29901&remove=1', action: 'remove', id: 29901},
					{data: 'id=85950&remove=1', action: 'remove', id: 85950},
					{data: 'id=29903&remove=1', action: 'remove', id: 29903},
					{data: 'id=85952&remove=1', action: 'remove', id: 85952},
					{data: 'id=29902&remove=1', action: 'remove', id: 29902},
					{data: 'id=85951&remove=1', action: 'remove', id: 85951},
					{data: 'id=29916&remove=1', action: 'remove', id: 29916},
					{data: 'id=85965&remove=1', action: 'remove', id: 85965},
					{data: 'id=29917&remove=1', action: 'remove', id: 29917},
					{data: 'id=85966&remove=1', action: 'remove', id: 85966},
					{data: 'id=29919&remove=1', action: 'remove', id: 29919},
					{data: 'id=85968&remove=1', action: 'remove', id: 85968},
					{data: 'id=29918&remove=1', action: 'remove', id: 29918},
					{data: 'id=85967&remove=1', action: 'remove', id: 85967},
					{data: 'id=29932&remove=1', action: 'remove', id: 29932},
					{data: 'id=85981&remove=1', action: 'remove', id: 85981},
					{data: 'id=29934&remove=1', action: 'remove', id: 29934},
					{data: 'id=85983&remove=1', action: 'remove', id: 85983},
					{data: 'id=29933&remove=1', action: 'remove', id: 29933},
					{data: 'id=85982&remove=1', action: 'remove', id: 85982},
					{data: 'id=29947&remove=1', action: 'remove', id: 29947},
					{data: 'id=85996&remove=1', action: 'remove', id: 85996},
					{data: 'id=29948&remove=1', action: 'remove', id: 29948},
					{data: 'id=29949&remove=1', action: 'remove', id: 29949},
					{data: 'id=29951&remove=1', action: 'remove', id: 29951},
					{data: 'id=29950&remove=1', action: 'remove', id: 29950},
					{data: 'id=120146&remove=1', action: 'remove', id: 120146},
					{data: 'id=120147&remove=1', action: 'remove', id: 120147},
					{data: 'id=120148&remove=1', action: 'remove', id: 120148},
					{data: 'id=120149&remove=1', action: 'remove', id: 120149},
					{data: 'id=120150&remove=1', action: 'remove', id: 120150},
					{data: 'id=120151&remove=1', action: 'remove', id: 120151},
					{data: 'id=120152&remove=1', action: 'remove', id: 120152},
					{data: 'id=120153&remove=1', action: 'remove', id: 120153},
					{data: 'id=120154&remove=1', action: 'remove', id: 120154},
					{data: 'id=120155&remove=1', action: 'remove', id: 120155},
					{data: 'id=120156&remove=1', action: 'remove', id: 120156},
					{data: 'id=120157&remove=1', action: 'remove', id: 120157},
					{data: 'id=120158&remove=1', action: 'remove', id: 120158},
					{data: 'id=120159&remove=1', action: 'remove', id: 120159},
					{data: 'id=120160&remove=1', action: 'remove', id: 120160},
					{data: 'id=120161&remove=1', action: 'remove', id: 120161},
					{data: 'id=120162&remove=1', action: 'remove', id: 120162},
					{data: 'id=120163&remove=1', action: 'remove', id: 120163},
					{data: 'id=120164&remove=1', action: 'remove', id: 120164},
					{data: 'id=120165&remove=1', action: 'remove', id: 120165},
					{data: 'id=120166&remove=1', action: 'remove', id: 120166},
					{data: 'id=120167&remove=1', action: 'remove', id: 120167},
					{data: 'id=120168&remove=1', action: 'remove', id: 120168},
					{data: 'id=120169&remove=1', action: 'remove', id: 120169},
					{data: 'id=120170&remove=1', action: 'remove', id: 120170},
					{data: 'id=120171&remove=1', action: 'remove', id: 120171},
					{data: 'id=120172&remove=1', action: 'remove', id: 120172},
					{data: 'id=120173&remove=1', action: 'remove', id: 120173},
					{data: 'id=120174&remove=1', action: 'remove', id: 120174},
					{data: 'id=120175&remove=1', action: 'remove', id: 120175},
					{data: 'id=120176&remove=1', action: 'remove', id: 120176},
					{data: 'id=120177&remove=1', action: 'remove', id: 120177},
					{data: 'id=120178&remove=1', action: 'remove', id: 120178},
					{data: 'id=120179&remove=1', action: 'remove', id: 120179},
					{data: 'id=120180&remove=1', action: 'remove', id: 120180},
					{data: 'id=120181&remove=1', action: 'remove', id: 120181},
					{data: 'id=120182&remove=1', action: 'remove', id: 120182},
					{data: 'id=120183&remove=1', action: 'remove', id: 120183},
					{data: 'id=120184&remove=1', action: 'remove', id: 120184},
					{data: 'id=120185&remove=1', action: 'remove', id: 120185},
					{data: 'id=120186&remove=1', action: 'remove', id: 120186},
					{data: 'id=120187&remove=1', action: 'remove', id: 120187},
					{data: 'id=120188&remove=1', action: 'remove', id: 120188},
					{data: 'id=120189&remove=1', action: 'remove', id: 120189},
					{data: 'id=120190&remove=1', action: 'remove', id: 120190},
					{data: 'id=120191&remove=1', action: 'remove', id: 120191},
					{data: 'id=120192&remove=1', action: 'remove', id: 120192},
					{data: 'id=120193&remove=1', action: 'remove', id: 120193},
					{data: 'id=120194&remove=1', action: 'remove', id: 120194},
					{data: 'id=120195&remove=1', action: 'remove', id: 120195},
					{data: 'id=120196&remove=1', action: 'remove', id: 120196},
					{data: 'id=120197&remove=1', action: 'remove', id: 120197},
					{data: 'id=120198&remove=1', action: 'remove', id: 120198},
					{data: 'id=120199&remove=1', action: 'remove', id: 120199},
					{data: 'id=120200&remove=1', action: 'remove', id: 120200},
					{data: 'id=120201&remove=1', action: 'remove', id: 120201},
					{data: 'id=120202&remove=1', action: 'remove', id: 120202},
					{data: 'id=120203&remove=1', action: 'remove', id: 120203},
					{data: 'id=120204&remove=1', action: 'remove', id: 120204},
					{data: 'id=120205&remove=1', action: 'remove', id: 120205},
					{data: 'id=120206&remove=1', action: 'remove', id: 120206},
					{data: 'id=120207&remove=1', action: 'remove', id: 120207},
					{data: 'id=120208&remove=1', action: 'remove', id: 120208},
					{data: 'id=120209&remove=1', action: 'remove', id: 120209},
					{data: 'id=120210&remove=1', action: 'remove', id: 120210},
					{data: 'id=120211&remove=1', action: 'remove', id: 120211},
					{data: 'id=120212&remove=1', action: 'remove', id: 120212},
					{data: 'id=120213&remove=1', action: 'remove', id: 120213},
					{data: 'id=120214&remove=1', action: 'remove', id: 120214},
					{data: 'id=120215&remove=1', action: 'remove', id: 120215},
					{data: 'id=120216&remove=1', action: 'remove', id: 120216},
					{data: 'id=120217&remove=1', action: 'remove', id: 120217},
					{data: 'id=120218&remove=1', action: 'remove', id: 120218},
					{data: 'id=120219&remove=1', action: 'remove', id: 120219},
					{data: 'id=120220&remove=1', action: 'remove', id: 120220},
					{data: 'id=120221&remove=1', action: 'remove', id: 120221},
					{data: 'id=120222&remove=1', action: 'remove', id: 120222},
					{data: 'id=120223&remove=1', action: 'remove', id: 120223},
					{data: 'id=120224&remove=1', action: 'remove', id: 120224},
					{data: 'id=120225&remove=1', action: 'remove', id: 120225},
					{data: 'id=120226&remove=1', action: 'remove', id: 120226},
					{data: 'id=120227&remove=1', action: 'remove', id: 120227},
					{data: 'id=120228&remove=1', action: 'remove', id: 120228},
					{data: 'id=120229&remove=1', action: 'remove', id: 120229},
					{data: 'id=120230&remove=1', action: 'remove', id: 120230},
					{data: 'id=120231&remove=1', action: 'remove', id: 120231},
					{data: 'id=120232&remove=1', action: 'remove', id: 120232},
					{data: 'id=120233&remove=1', action: 'remove', id: 120233},
					{data: 'id=120234&remove=1', action: 'remove', id: 120234},
					{data: 'id=120235&remove=1', action: 'remove', id: 120235},
					{data: 'id=120236&remove=1', action: 'remove', id: 120236},
					{data: 'id=120237&remove=1', action: 'remove', id: 120237},
					{data: 'id=120238&remove=1', action: 'remove', id: 120238},
					{data: 'id=120239&remove=1', action: 'remove', id: 120239},
					{data: 'id=120240&remove=1', action: 'remove', id: 120240},
					{data: 'id=120241&remove=1', action: 'remove', id: 120241},
					{data: 'id=120242&remove=1', action: 'remove', id: 120242},
					{data: 'id=120243&remove=1', action: 'remove', id: 120243},
					{data: 'id=120244&remove=1', action: 'remove', id: 120244},
					{data: 'id=120245&remove=1', action: 'remove', id: 120245},
					{data: 'id=120246&remove=1', action: 'remove', id: 120246},
					{data: 'id=120247&remove=1', action: 'remove', id: 120247},
					{data: 'id=120248&remove=1', action: 'remove', id: 120248},
					{data: 'id=120249&remove=1', action: 'remove', id: 120249},
					{data: 'id=120250&remove=1', action: 'remove', id: 120250},
					{data: 'id=120251&remove=1', action: 'remove', id: 120251},
					{data: 'id=120252&remove=1', action: 'remove', id: 120252},
					{data: 'id=120253&remove=1', action: 'remove', id: 120253},
					{data: 'id=120254&remove=1', action: 'remove', id: 120254},
					{data: 'id=120255&remove=1', action: 'remove', id: 120255},
					{data: 'id=120256&remove=1', action: 'remove', id: 120256},
					{data: 'id=120257&remove=1', action: 'remove', id: 120257},
					{data: 'id=120258&remove=1', action: 'remove', id: 120258},
					{data: 'id=120259&remove=1', action: 'remove', id: 120259},
					{data: 'id=120260&remove=1', action: 'remove', id: 120260},
					{data: 'id=120261&remove=1', action: 'remove', id: 120261},
					{data: 'id=120262&remove=1', action: 'remove', id: 120262},
					{data: 'id=120263&remove=1', action: 'remove', id: 120263},
					{data: 'id=120264&remove=1', action: 'remove', id: 120264},
					{data: 'id=120265&remove=1', action: 'remove', id: 120265},
					{data: 'id=120266&remove=1', action: 'remove', id: 120266},
					{data: 'id=120267&remove=1', action: 'remove', id: 120267},
					{data: 'id=120268&remove=1', action: 'remove', id: 120268},
					{data: 'id=120269&remove=1', action: 'remove', id: 120269},
					{data: 'id=120270&remove=1', action: 'remove', id: 120270},
					{data: 'id=120271&remove=1', action: 'remove', id: 120271},
					{data: 'id=120272&remove=1', action: 'remove', id: 120272},
					{data: 'id=120273&remove=1', action: 'remove', id: 120273},
					{data: 'id=120274&remove=1', action: 'remove', id: 120274},
					{data: 'id=120275&remove=1', action: 'remove', id: 120275},
					{data: 'id=120276&remove=1', action: 'remove', id: 120276},
					{data: 'id=120277&remove=1', action: 'remove', id: 120277},
					{data: 'id=120278&remove=1', action: 'remove', id: 120278},
					{data: 'id=120279&remove=1', action: 'remove', id: 120279},
					{data: 'id=120280&remove=1', action: 'remove', id: 120280},
					{data: 'id=120281&remove=1', action: 'remove', id: 120281},
					{data: 'id=120282&remove=1', action: 'remove', id: 120282},
					{data: 'id=120283&remove=1', action: 'remove', id: 120283},
					{data: 'id=120284&remove=1', action: 'remove', id: 120284},
					{data: 'id=120285&remove=1', action: 'remove', id: 120285},
					{data: 'id=120286&remove=1', action: 'remove', id: 120286},
					{data: 'id=120287&remove=1', action: 'remove', id: 120287},
					{data: 'id=120288&remove=1', action: 'remove', id: 120288},
					{data: 'id=120289&remove=1', action: 'remove', id: 120289},
					{data: 'id=120290&remove=1', action: 'remove', id: 120290},
					{data: 'id=120291&remove=1', action: 'remove', id: 120291},
					{data: 'id=120292&remove=1', action: 'remove', id: 120292},
					{data: 'id=120293&remove=1', action: 'remove', id: 120293},
					{data: 'id=120294&remove=1', action: 'remove', id: 120294},
					{data: 'id=120295&remove=1', action: 'remove', id: 120295},
					{data: 'id=120296&remove=1', action: 'remove', id: 120296},
					{data: 'id=120297&remove=1', action: 'remove', id: 120297},
					{data: 'id=120298&remove=1', action: 'remove', id: 120298},
					{data: 'id=120299&remove=1', action: 'remove', id: 120299},
					{data: 'id=120300&remove=1', action: 'remove', id: 120300},
					{data: 'id=120301&remove=1', action: 'remove', id: 120301},
					{data: 'id=120302&remove=1', action: 'remove', id: 120302},
					{data: 'id=120303&remove=1', action: 'remove', id: 120303},
					{data: 'id=120304&remove=1', action: 'remove', id: 120304},
					{data: 'id=120305&remove=1', action: 'remove', id: 120305},
					{data: 'id=120306&remove=1', action: 'remove', id: 120306},
					{data: 'id=120307&remove=1', action: 'remove', id: 120307},
					{data: 'id=120308&remove=1', action: 'remove', id: 120308},
					{data: 'id=29833&remove=1', action: 'remove', id: 29833},
					{data: 'id=85882&remove=1', action: 'remove', id: 85882},
					{data: 'id=29832&remove=1', action: 'remove', id: 29832},
					{data: 'id=85881&remove=1', action: 'remove', id: 85881},
					{data: 'id=29843&remove=1', action: 'remove', id: 29843},
					{data: 'id=85892&remove=1', action: 'remove', id: 85892},
					{data: 'id=29842&remove=1', action: 'remove', id: 29842},
					{data: 'id=85891&remove=1', action: 'remove', id: 85891},
					{data: 'id=29856&remove=1', action: 'remove', id: 29856},
					{data: 'id=85905&remove=1', action: 'remove', id: 85905},
					{data: 'id=29858&remove=1', action: 'remove', id: 29858},
					{data: 'id=85907&remove=1', action: 'remove', id: 85907},
					{data: 'id=29857&remove=1', action: 'remove', id: 29857},
					{data: 'id=85906&remove=1', action: 'remove', id: 85906},
					{data: 'id=29871&remove=1', action: 'remove', id: 29871},
					{data: 'id=85920&remove=1', action: 'remove', id: 85920},
					{data: 'id=29873&remove=1', action: 'remove', id: 29873},
					{data: 'id=85922&remove=1', action: 'remove', id: 85922},
					{data: 'id=29872&remove=1', action: 'remove', id: 29872},
					{data: 'id=85921&remove=1', action: 'remove', id: 85921},
					{data: 'id=120309&remove=1', action: 'remove', id: 120309},
					{data: 'id=120310&remove=1', action: 'remove', id: 120310},
					{data: 'id=120311&remove=1', action: 'remove', id: 120311},
					{data: 'id=120312&remove=1', action: 'remove', id: 120312},
					{data: 'id=120313&remove=1', action: 'remove', id: 120313},
					{data: 'id=120314&remove=1', action: 'remove', id: 120314},
					{data: 'id=120315&remove=1', action: 'remove', id: 120315},
					{data: 'id=120316&remove=1', action: 'remove', id: 120316},
					{data: 'id=120317&remove=1', action: 'remove', id: 120317},
					{data: 'id=120318&remove=1', action: 'remove', id: 120318},
					{data: 'id=120319&remove=1', action: 'remove', id: 120319},
					{data: 'id=120320&remove=1', action: 'remove', id: 120320},
					{data: 'id=120321&remove=1', action: 'remove', id: 120321},
					{data: 'id=120322&remove=1', action: 'remove', id: 120322},
					{data: 'id=120323&remove=1', action: 'remove', id: 120323},
					{data: 'id=120324&remove=1', action: 'remove', id: 120324},
					{data: 'id=120325&remove=1', action: 'remove', id: 120325},
					{data: 'id=120326&remove=1', action: 'remove', id: 120326},
					{data: 'id=120327&remove=1', action: 'remove', id: 120327},
					{data: 'id=120328&remove=1', action: 'remove', id: 120328},
					{data: 'id=120329&remove=1', action: 'remove', id: 120329},
					{data: 'id=120330&remove=1', action: 'remove', id: 120330},
					{data: 'id=120331&remove=1', action: 'remove', id: 120331},
					{data: 'id=120332&remove=1', action: 'remove', id: 120332},
					{data: 'id=120333&remove=1', action: 'remove', id: 120333},
					{data: 'id=120334&remove=1', action: 'remove', id: 120334},
					{data: 'id=120335&remove=1', action: 'remove', id: 120335},
					{data: 'id=120336&remove=1', action: 'remove', id: 120336},
					{data: 'id=120337&remove=1', action: 'remove', id: 120337},
					{data: 'id=120338&remove=1', action: 'remove', id: 120338},
					{data: 'id=120339&remove=1', action: 'remove', id: 120339},
					{data: 'id=120340&remove=1', action: 'remove', id: 120340},
					{data: 'id=120341&remove=1', action: 'remove', id: 120341},
					{data: 'id=120342&remove=1', action: 'remove', id: 120342},
					{data: 'id=120343&remove=1', action: 'remove', id: 120343},
					{data: 'id=120344&remove=1', action: 'remove', id: 120344},
					{data: 'id=120345&remove=1', action: 'remove', id: 120345},
					{data: 'id=120346&remove=1', action: 'remove', id: 120346},
					{data: 'id=120347&remove=1', action: 'remove', id: 120347},
					{data: 'id=120348&remove=1', action: 'remove', id: 120348},
					{data: 'id=120349&remove=1', action: 'remove', id: 120349},
					{data: 'id=120350&remove=1', action: 'remove', id: 120350},
					{data: 'id=120351&remove=1', action: 'remove', id: 120351},
					{data: 'id=120352&remove=1', action: 'remove', id: 120352},
					{data: 'id=120353&remove=1', action: 'remove', id: 120353},
					{data: 'id=120354&remove=1', action: 'remove', id: 120354},
					{data: 'id=120355&remove=1', action: 'remove', id: 120355},
					{data: 'id=120356&remove=1', action: 'remove', id: 120356},
					{data: 'id=120357&remove=1', action: 'remove', id: 120357},
					{data: 'id=120358&remove=1', action: 'remove', id: 120358},
					{data: 'id=120359&remove=1', action: 'remove', id: 120359},
					{data: 'id=120360&remove=1', action: 'remove', id: 120360},
					{data: 'id=120361&remove=1', action: 'remove', id: 120361},
					{data: 'id=120362&remove=1', action: 'remove', id: 120362},
					{data: 'id=120363&remove=1', action: 'remove', id: 120363},
					{data: 'id=120364&remove=1', action: 'remove', id: 120364},
					{data: 'id=120365&remove=1', action: 'remove', id: 120365},
					{data: 'id=120366&remove=1', action: 'remove', id: 120366},
					{data: 'id=120367&remove=1', action: 'remove', id: 120367},
					{data: 'id=120368&remove=1', action: 'remove', id: 120368},
					{data: 'id=120369&remove=1', action: 'remove', id: 120369},
					{data: 'id=120370&remove=1', action: 'remove', id: 120370},
					{data: 'id=120371&remove=1', action: 'remove', id: 120371},
					{data: 'id=120372&remove=1', action: 'remove', id: 120372},
					{data: 'id=120373&remove=1', action: 'remove', id: 120373},
					{data: 'id=120374&remove=1', action: 'remove', id: 120374},
					{data: 'id=120375&remove=1', action: 'remove', id: 120375},
					{data: 'id=120376&remove=1', action: 'remove', id: 120376},
					{data: 'id=120377&remove=1', action: 'remove', id: 120377},
					{data: 'id=120378&remove=1', action: 'remove', id: 120378},
					{data: 'id=29885&remove=1', action: 'remove', id: 29885},
					{data: 'id=85934&remove=1', action: 'remove', id: 85934},
					{data: 'id=29887&remove=1', action: 'remove', id: 29887},
					{data: 'id=85936&remove=1', action: 'remove', id: 85936},
					{data: 'id=29886&remove=1', action: 'remove', id: 29886},
					{data: 'id=85935&remove=1', action: 'remove', id: 85935},
					{data: 'id=120379&remove=1', action: 'remove', id: 120379},
					{data: 'id=120380&remove=1', action: 'remove', id: 120380},
					{data: 'id=120381&remove=1', action: 'remove', id: 120381},
					{data: 'id=120382&remove=1', action: 'remove', id: 120382},
					{data: 'id=120383&remove=1', action: 'remove', id: 120383},
					{data: 'id=120384&remove=1', action: 'remove', id: 120384},
					{data: 'id=120385&remove=1', action: 'remove', id: 120385},
					{data: 'id=120386&remove=1', action: 'remove', id: 120386},
					{data: 'id=120387&remove=1', action: 'remove', id: 120387},
					{data: 'id=120388&remove=1', action: 'remove', id: 120388},
					{data: 'id=120389&remove=1', action: 'remove', id: 120389},
					{data: 'id=120390&remove=1', action: 'remove', id: 120390},
					{data: 'id=120391&remove=1', action: 'remove', id: 120391},
					{data: 'id=120392&remove=1', action: 'remove', id: 120392},
					{data: 'id=120393&remove=1', action: 'remove', id: 120393},
					{data: 'id=120394&remove=1', action: 'remove', id: 120394},
					{data: 'id=120395&remove=1', action: 'remove', id: 120395},
					{data: 'id=120396&remove=1', action: 'remove', id: 120396},
					{data: 'id=120397&remove=1', action: 'remove', id: 120397},
					{data: 'id=120398&remove=1', action: 'remove', id: 120398},
					{data: 'id=120399&remove=1', action: 'remove', id: 120399},
					{data: 'id=120400&remove=1', action: 'remove', id: 120400},
					{data: 'id=120401&remove=1', action: 'remove', id: 120401},
					{data: 'id=120402&remove=1', action: 'remove', id: 120402},
					{data: 'id=120403&remove=1', action: 'remove', id: 120403},
					{data: 'id=120404&remove=1', action: 'remove', id: 120404},
					{data: 'id=120405&remove=1', action: 'remove', id: 120405},
					{data: 'id=120406&remove=1', action: 'remove', id: 120406},
					{data: 'id=120407&remove=1', action: 'remove', id: 120407},
					{data: 'id=120408&remove=1', action: 'remove', id: 120408},
					{data: 'id=120409&remove=1', action: 'remove', id: 120409},
					{data: 'id=120410&remove=1', action: 'remove', id: 120410},
					{data: 'id=120411&remove=1', action: 'remove', id: 120411},
					{data: 'id=120412&remove=1', action: 'remove', id: 120412},
					{data: 'id=120413&remove=1', action: 'remove', id: 120413},
					{data: 'id=120414&remove=1', action: 'remove', id: 120414},
					{data: 'id=120415&remove=1', action: 'remove', id: 120415},
					{data: 'id=120416&remove=1', action: 'remove', id: 120416},
					{data: 'id=120417&remove=1', action: 'remove', id: 120417},
					{data: 'id=120418&remove=1', action: 'remove', id: 120418},
					{data: 'id=120419&remove=1', action: 'remove', id: 120419},
					{data: 'id=120420&remove=1', action: 'remove', id: 120420},
					{data: 'id=120421&remove=1', action: 'remove', id: 120421},
					{data: 'id=120422&remove=1', action: 'remove', id: 120422},
					{data: 'id=120423&remove=1', action: 'remove', id: 120423},
					{data: 'id=120424&remove=1', action: 'remove', id: 120424},
					{data: 'id=120425&remove=1', action: 'remove', id: 120425},
					{data: 'id=120426&remove=1', action: 'remove', id: 120426},
					{data: 'id=120427&remove=1', action: 'remove', id: 120427},
					{data: 'id=120428&remove=1', action: 'remove', id: 120428},
					{data: 'id=120429&remove=1', action: 'remove', id: 120429},
					{data: 'id=120430&remove=1', action: 'remove', id: 120430},
					{data: 'id=120431&remove=1', action: 'remove', id: 120431},
					{data: 'id=120432&remove=1', action: 'remove', id: 120432},
					{data: 'id=120433&remove=1', action: 'remove', id: 120433},
					{data: 'id=120434&remove=1', action: 'remove', id: 120434},
					{data: 'id=120435&remove=1', action: 'remove', id: 120435},
					{data: 'id=120436&remove=1', action: 'remove', id: 120436},
					{data: 'id=120437&remove=1', action: 'remove', id: 120437},
					{data: 'id=120438&remove=1', action: 'remove', id: 120438},
					{data: 'id=120439&remove=1', action: 'remove', id: 120439},
					{data: 'id=120440&remove=1', action: 'remove', id: 120440},
					{data: 'id=120441&remove=1', action: 'remove', id: 120441},
					{data: 'id=120442&remove=1', action: 'remove', id: 120442},
					{data: 'id=120443&remove=1', action: 'remove', id: 120443},
					{data: 'id=120444&remove=1', action: 'remove', id: 120444},
					{data: 'id=120445&remove=1', action: 'remove', id: 120445},
					{data: 'id=120446&remove=1', action: 'remove', id: 120446},
					{data: 'id=120447&remove=1', action: 'remove', id: 120447},
					{data: 'id=120448&remove=1', action: 'remove', id: 120448},
					{data: 'id=120449&remove=1', action: 'remove', id: 120449},
					{data: 'id=120450&remove=1', action: 'remove', id: 120450},
					{data: 'id=120451&remove=1', action: 'remove', id: 120451},
					{data: 'id=120452&remove=1', action: 'remove', id: 120452},
					{data: 'id=120453&remove=1', action: 'remove', id: 120453},
					{data: 'id=120454&remove=1', action: 'remove', id: 120454},
					{data: 'id=120455&remove=1', action: 'remove', id: 120455},
					{data: 'id=120456&remove=1', action: 'remove', id: 120456},
					{data: 'id=120457&remove=1', action: 'remove', id: 120457},
					{data: 'id=120458&remove=1', action: 'remove', id: 120458},
					{data: 'id=120459&remove=1', action: 'remove', id: 120459},
					{data: 'id=120460&remove=1', action: 'remove', id: 120460},
					{data: 'id=120461&remove=1', action: 'remove', id: 120461},
					{data: 'id=120462&remove=1', action: 'remove', id: 120462},
					{data: 'id=120463&remove=1', action: 'remove', id: 120463},
					{data: 'id=120464&remove=1', action: 'remove', id: 120464},
					{data: 'id=120465&remove=1', action: 'remove', id: 120465},
					{data: 'id=120466&remove=1', action: 'remove', id: 120466},
					{data: 'id=120467&remove=1', action: 'remove', id: 120467},
					{data: 'id=120468&remove=1', action: 'remove', id: 120468},
					{data: 'id=120469&remove=1', action: 'remove', id: 120469},
					{data: 'id=120470&remove=1', action: 'remove', id: 120470},
					{data: 'id=120471&remove=1', action: 'remove', id: 120471},
					{data: 'id=120472&remove=1', action: 'remove', id: 120472},
					{data: 'id=120473&remove=1', action: 'remove', id: 120473},
					{data: 'id=120474&remove=1', action: 'remove', id: 120474},
					{data: 'id=120475&remove=1', action: 'remove', id: 120475},
					{data: 'id=120476&remove=1', action: 'remove', id: 120476},
					{data: 'id=120477&remove=1', action: 'remove', id: 120477},
					{data: 'id=120478&remove=1', action: 'remove', id: 120478},
					{data: 'id=120479&remove=1', action: 'remove', id: 120479},
					{data: 'id=120480&remove=1', action: 'remove', id: 120480},
					{data: 'id=120481&remove=1', action: 'remove', id: 120481},
					{data: 'id=120482&remove=1', action: 'remove', id: 120482},
					{data: 'id=120483&remove=1', action: 'remove', id: 120483},
					{data: 'id=120484&remove=1', action: 'remove', id: 120484},
					{data: 'id=120485&remove=1', action: 'remove', id: 120485},
					{data: 'id=120486&remove=1', action: 'remove', id: 120486},
					{data: 'id=120487&remove=1', action: 'remove', id: 120487},
					{data: 'id=120488&remove=1', action: 'remove', id: 120488},
					{data: 'id=120489&remove=1', action: 'remove', id: 120489},
					{data: 'id=120490&remove=1', action: 'remove', id: 120490},
					{data: 'id=120491&remove=1', action: 'remove', id: 120491},
					{data: 'id=120492&remove=1', action: 'remove', id: 120492},
					{data: 'id=120493&remove=1', action: 'remove', id: 120493},
					{data: 'id=120494&remove=1', action: 'remove', id: 120494},
					{data: 'id=120495&remove=1', action: 'remove', id: 120495},
					{data: 'id=120496&remove=1', action: 'remove', id: 120496},
					{data: 'id=120497&remove=1', action: 'remove', id: 120497},
					{data: 'id=120498&remove=1', action: 'remove', id: 120498},
					{data: 'id=120499&remove=1', action: 'remove', id: 120499},
					{data: 'id=120500&remove=1', action: 'remove', id: 120500},
					{data: 'id=120501&remove=1', action: 'remove', id: 120501},
					{data: 'id=120502&remove=1', action: 'remove', id: 120502},
					{data: 'id=120503&remove=1', action: 'remove', id: 120503},
					{data: 'id=120504&remove=1', action: 'remove', id: 120504},
					{data: 'id=120505&remove=1', action: 'remove', id: 120505},
					{data: 'id=120506&remove=1', action: 'remove', id: 120506},
					{data: 'id=120507&remove=1', action: 'remove', id: 120507},
					{data: 'id=120508&remove=1', action: 'remove', id: 120508},
					{data: 'id=120509&remove=1', action: 'remove', id: 120509},
					{data: 'id=120510&remove=1', action: 'remove', id: 120510},
					{data: 'id=120511&remove=1', action: 'remove', id: 120511},
					{data: 'id=120512&remove=1', action: 'remove', id: 120512},
					{data: 'id=120513&remove=1', action: 'remove', id: 120513},
					{data: 'id=120514&remove=1', action: 'remove', id: 120514},
					{data: 'id=120515&remove=1', action: 'remove', id: 120515},
					{data: 'id=120516&remove=1', action: 'remove', id: 120516},
					{data: 'id=120517&remove=1', action: 'remove', id: 120517},
					{data: 'id=120518&remove=1', action: 'remove', id: 120518},
					{data: 'id=120519&remove=1', action: 'remove', id: 120519},
					{data: 'id=120520&remove=1', action: 'remove', id: 120520},
					{data: 'id=120521&remove=1', action: 'remove', id: 120521},
					{data: 'id=120522&remove=1', action: 'remove', id: 120522},
					{data: 'id=120523&remove=1', action: 'remove', id: 120523},
					{data: 'id=120524&remove=1', action: 'remove', id: 120524},
					{data: 'id=120525&remove=1', action: 'remove', id: 120525},
					{data: 'id=120526&remove=1', action: 'remove', id: 120526},
					{data: 'id=120527&remove=1', action: 'remove', id: 120527},
					{data: 'id=120528&remove=1', action: 'remove', id: 120528},
					{data: 'id=120529&remove=1', action: 'remove', id: 120529},
					{data: 'id=120530&remove=1', action: 'remove', id: 120530},
					{data: 'id=120531&remove=1', action: 'remove', id: 120531},
					{data: 'id=120532&remove=1', action: 'remove', id: 120532},
					{data: 'id=120533&remove=1', action: 'remove', id: 120533},
					{data: 'id=120534&remove=1', action: 'remove', id: 120534},
					{data: 'id=120535&remove=1', action: 'remove', id: 120535},
					{data: 'id=120536&remove=1', action: 'remove', id: 120536},
					{data: 'id=120537&remove=1', action: 'remove', id: 120537},
					{data: 'id=120538&remove=1', action: 'remove', id: 120538},
					{data: 'id=120539&remove=1', action: 'remove', id: 120539},
					{data: 'id=120540&remove=1', action: 'remove', id: 120540},
					{data: 'id=120541&remove=1', action: 'remove', id: 120541},
					{data: 'id=120542&remove=1', action: 'remove', id: 120542},
					{data: 'id=120543&remove=1', action: 'remove', id: 120543},
					{data: 'id=120544&remove=1', action: 'remove', id: 120544},
					{data: 'id=120545&remove=1', action: 'remove', id: 120545},
					{data: 'id=120546&remove=1', action: 'remove', id: 120546},
					{data: 'id=120547&remove=1', action: 'remove', id: 120547},
					{data: 'id=120548&remove=1', action: 'remove', id: 120548},
					{data: 'id=120549&remove=1', action: 'remove', id: 120549},
					{data: 'id=120550&remove=1', action: 'remove', id: 120550},
					{data: 'id=120551&remove=1', action: 'remove', id: 120551},
					{data: 'id=120552&remove=1', action: 'remove', id: 120552},
					{data: 'id=120553&remove=1', action: 'remove', id: 120553},
					{data: 'id=120554&remove=1', action: 'remove', id: 120554},
					{data: 'id=120555&remove=1', action: 'remove', id: 120555},
					{data: 'id=120556&remove=1', action: 'remove', id: 120556},
					{data: 'id=120557&remove=1', action: 'remove', id: 120557},
					{data: 'id=120558&remove=1', action: 'remove', id: 120558},
					{data: 'id=120559&remove=1', action: 'remove', id: 120559},
					{data: 'id=120560&remove=1', action: 'remove', id: 120560},
					{data: 'id=120561&remove=1', action: 'remove', id: 120561},
					{data: 'id=120562&remove=1', action: 'remove', id: 120562},
					{data: 'id=120563&remove=1', action: 'remove', id: 120563},
					{data: 'id=120564&remove=1', action: 'remove', id: 120564},
					{data: 'id=120565&remove=1', action: 'remove', id: 120565},
					{data: 'id=120566&remove=1', action: 'remove', id: 120566},
					{data: 'id=120567&remove=1', action: 'remove', id: 120567},
					{data: 'id=120568&remove=1', action: 'remove', id: 120568},
					{data: 'id=120569&remove=1', action: 'remove', id: 120569},
					{data: 'id=120570&remove=1', action: 'remove', id: 120570},
					{data: 'id=120571&remove=1', action: 'remove', id: 120571},
					{data: 'id=120572&remove=1', action: 'remove', id: 120572},
					{data: 'id=120573&remove=1', action: 'remove', id: 120573},
					{data: 'id=120574&remove=1', action: 'remove', id: 120574},
					{data: 'id=120575&remove=1', action: 'remove', id: 120575},
					{data: 'id=120576&remove=1', action: 'remove', id: 120576},
					{data: 'id=120577&remove=1', action: 'remove', id: 120577},
					{data: 'id=120578&remove=1', action: 'remove', id: 120578},
					{data: 'id=120579&remove=1', action: 'remove', id: 120579},
					{data: 'id=120580&remove=1', action: 'remove', id: 120580},
					{data: 'id=120581&remove=1', action: 'remove', id: 120581},
					{data: 'id=120582&remove=1', action: 'remove', id: 120582},
					{data: 'id=120583&remove=1', action: 'remove', id: 120583},
					{data: 'id=120584&remove=1', action: 'remove', id: 120584},
					{data: 'id=120585&remove=1', action: 'remove', id: 120585},
					{data: 'id=120586&remove=1', action: 'remove', id: 120586},
					{data: 'id=120587&remove=1', action: 'remove', id: 120587},
					{data: 'id=120588&remove=1', action: 'remove', id: 120588},
					{data: 'id=120589&remove=1', action: 'remove', id: 120589},
					{data: 'id=120590&remove=1', action: 'remove', id: 120590},
					{data: 'id=120591&remove=1', action: 'remove', id: 120591},
					{data: 'id=120592&remove=1', action: 'remove', id: 120592},
					{data: 'id=120593&remove=1', action: 'remove', id: 120593},
					{data: 'id=120594&remove=1', action: 'remove', id: 120594},
					{data: 'id=120595&remove=1', action: 'remove', id: 120595},
					{data: 'id=120596&remove=1', action: 'remove', id: 120596},
					{data: 'id=120597&remove=1', action: 'remove', id: 120597},
					{data: 'id=120598&remove=1', action: 'remove', id: 120598},
					{data: 'id=120599&remove=1', action: 'remove', id: 120599},
					{data: 'id=120600&remove=1', action: 'remove', id: 120600},
					{data: 'id=120601&remove=1', action: 'remove', id: 120601},
					{data: 'id=120602&remove=1', action: 'remove', id: 120602},
					{data: 'id=120603&remove=1', action: 'remove', id: 120603},
					{data: 'id=120604&remove=1', action: 'remove', id: 120604},
					{data: 'id=120605&remove=1', action: 'remove', id: 120605},
					{data: 'id=120606&remove=1', action: 'remove', id: 120606},
					{data: 'id=120607&remove=1', action: 'remove', id: 120607},
					{data: 'id=120608&remove=1', action: 'remove', id: 120608},
					{data: 'id=120609&remove=1', action: 'remove', id: 120609},
					{data: 'id=120610&remove=1', action: 'remove', id: 120610},
					{data: 'id=120611&remove=1', action: 'remove', id: 120611},
					{data: 'id=120612&remove=1', action: 'remove', id: 120612},
					{data: 'id=120613&remove=1', action: 'remove', id: 120613},
					{data: 'id=120614&remove=1', action: 'remove', id: 120614},
					{data: 'id=120615&remove=1', action: 'remove', id: 120615},
					{data: 'id=120616&remove=1', action: 'remove', id: 120616},
					{data: 'id=120617&remove=1', action: 'remove', id: 120617},
					{data: 'id=120618&remove=1', action: 'remove', id: 120618},
					{data: 'id=120619&remove=1', action: 'remove', id: 120619},
					{data: 'id=120620&remove=1', action: 'remove', id: 120620},
					{data: 'id=120621&remove=1', action: 'remove', id: 120621},
					{data: 'id=120622&remove=1', action: 'remove', id: 120622},
					{data: 'id=120623&remove=1', action: 'remove', id: 120623},
					{data: 'id=120624&remove=1', action: 'remove', id: 120624},
					{data: 'id=120625&remove=1', action: 'remove', id: 120625},
					{data: 'id=120626&remove=1', action: 'remove', id: 120626},
					{data: 'id=120627&remove=1', action: 'remove', id: 120627},
					{data: 'id=120628&remove=1', action: 'remove', id: 120628},
					{data: 'id=120629&remove=1', action: 'remove', id: 120629},
					{data: 'id=120630&remove=1', action: 'remove', id: 120630},
					{data: 'id=120631&remove=1', action: 'remove', id: 120631},
					{data: 'id=120632&remove=1', action: 'remove', id: 120632},
					{data: 'id=120633&remove=1', action: 'remove', id: 120633},
					{data: 'id=120634&remove=1', action: 'remove', id: 120634},
					{data: 'id=120635&remove=1', action: 'remove', id: 120635},
					{data: 'id=120636&remove=1', action: 'remove', id: 120636},
					{data: 'id=120637&remove=1', action: 'remove', id: 120637},
					{data: 'id=120638&remove=1', action: 'remove', id: 120638},
					{data: 'id=120639&remove=1', action: 'remove', id: 120639},
					{data: 'id=120640&remove=1', action: 'remove', id: 120640},
					{data: 'id=120641&remove=1', action: 'remove', id: 120641},
					{data: 'id=120642&remove=1', action: 'remove', id: 120642},
					{data: 'id=120643&remove=1', action: 'remove', id: 120643},
					{data: 'id=120644&remove=1', action: 'remove', id: 120644},
					{data: 'id=120645&remove=1', action: 'remove', id: 120645},
					{data: 'id=120646&remove=1', action: 'remove', id: 120646},
					{data: 'id=120647&remove=1', action: 'remove', id: 120647},
					{data: 'id=120648&remove=1', action: 'remove', id: 120648},
					{data: 'id=120649&remove=1', action: 'remove', id: 120649},
					{data: 'id=120650&remove=1', action: 'remove', id: 120650},
					{data: 'id=120651&remove=1', action: 'remove', id: 120651},
					{data: 'id=120652&remove=1', action: 'remove', id: 120652},
					{data: 'id=120653&remove=1', action: 'remove', id: 120653},
					{data: 'id=120654&remove=1', action: 'remove', id: 120654},
					{data: 'id=120655&remove=1', action: 'remove', id: 120655},
					{data: 'id=120656&remove=1', action: 'remove', id: 120656},
					{data: 'id=120657&remove=1', action: 'remove', id: 120657},
					{data: 'id=120658&remove=1', action: 'remove', id: 120658},
					{data: 'id=120659&remove=1', action: 'remove', id: 120659},
					{data: 'id=120660&remove=1', action: 'remove', id: 120660},
					{data: 'id=120661&remove=1', action: 'remove', id: 120661},
					{data: 'id=120662&remove=1', action: 'remove', id: 120662},
					{data: 'id=120663&remove=1', action: 'remove', id: 120663},
					{data: 'id=120664&remove=1', action: 'remove', id: 120664},
					{data: 'id=120665&remove=1', action: 'remove', id: 120665},
					{data: 'id=120666&remove=1', action: 'remove', id: 120666},
					{data: 'id=120667&remove=1', action: 'remove', id: 120667},
					{data: 'id=120668&remove=1', action: 'remove', id: 120668},
					{data: 'id=120669&remove=1', action: 'remove', id: 120669},
					{data: 'id=120670&remove=1', action: 'remove', id: 120670},
					{data: 'id=120671&remove=1', action: 'remove', id: 120671},
					{data: 'id=120672&remove=1', action: 'remove', id: 120672},
					{data: 'id=120673&remove=1', action: 'remove', id: 120673},
					{data: 'id=120674&remove=1', action: 'remove', id: 120674},
					{data: 'id=120675&remove=1', action: 'remove', id: 120675},
					{data: 'id=120676&remove=1', action: 'remove', id: 120676},
					{data: 'id=120677&remove=1', action: 'remove', id: 120677},
					{data: 'id=120678&remove=1', action: 'remove', id: 120678},
					{data: 'id=120679&remove=1', action: 'remove', id: 120679},
					{data: 'id=120680&remove=1', action: 'remove', id: 120680},
					{data: 'id=120681&remove=1', action: 'remove', id: 120681},
					{data: 'id=120682&remove=1', action: 'remove', id: 120682},
					{data: 'id=120683&remove=1', action: 'remove', id: 120683},
					{data: 'id=120684&remove=1', action: 'remove', id: 120684},
					{data: 'id=120685&remove=1', action: 'remove', id: 120685},
					{data: 'id=120686&remove=1', action: 'remove', id: 120686},
					{data: 'id=120687&remove=1', action: 'remove', id: 120687},
					{data: 'id=120688&remove=1', action: 'remove', id: 120688},
					{data: 'id=120689&remove=1', action: 'remove', id: 120689},
					{data: 'id=120690&remove=1', action: 'remove', id: 120690},
					{data: 'id=120691&remove=1', action: 'remove', id: 120691},
					{data: 'id=120692&remove=1', action: 'remove', id: 120692},
					{data: 'id=120693&remove=1', action: 'remove', id: 120693},
					{data: 'id=120694&remove=1', action: 'remove', id: 120694},
					{data: 'id=120695&remove=1', action: 'remove', id: 120695},
					{data: 'id=120696&remove=1', action: 'remove', id: 120696},
					{data: 'id=120697&remove=1', action: 'remove', id: 120697},
					{data: 'id=120698&remove=1', action: 'remove', id: 120698},
					{data: 'id=120699&remove=1', action: 'remove', id: 120699},
					{data: 'id=120700&remove=1', action: 'remove', id: 120700},
					{data: 'id=120701&remove=1', action: 'remove', id: 120701},
					{data: 'id=120702&remove=1', action: 'remove', id: 120702},
					{data: 'id=120703&remove=1', action: 'remove', id: 120703},
					{data: 'id=120704&remove=1', action: 'remove', id: 120704},
					{data: 'id=120705&remove=1', action: 'remove', id: 120705},
					{data: 'id=120706&remove=1', action: 'remove', id: 120706},
					{data: 'id=120707&remove=1', action: 'remove', id: 120707},
					{data: 'id=120708&remove=1', action: 'remove', id: 120708},
					{data: 'id=120709&remove=1', action: 'remove', id: 120709},
					{data: 'id=120710&remove=1', action: 'remove', id: 120710},
					{data: 'id=120711&remove=1', action: 'remove', id: 120711},
					{data: 'id=120712&remove=1', action: 'remove', id: 120712},
					{data: 'id=8082&remove=1', action: 'remove', id: 8082},
					{data: 'id=119722&remove=1', action: 'remove', id: 119722},
					{data: 'id=119723&remove=1', action: 'remove', id: 119723},
					{data: 'id=119724&remove=1', action: 'remove', id: 119724},
					{data: 'id=718&remove=1', action: 'remove', id: 718},
					{data: 'id=119725&remove=1', action: 'remove', id: 119725},
					{data: 'id=1664&itemtype=53', action: 'update', id: 1664},
					{data: 'id=1728&remove=1', action: 'remove', id: 1728},
					{data: 'id=119726&remove=1', action: 'remove', id: 119726},
					{data: 'id=1829&itemtype=53', action: 'update', id: 1829},
					{data: 'id=1855&remove=1', action: 'remove', id: 1855},
					{data: 'id=1953&remove=1', action: 'remove', id: 1953},
					{data: 'id=119727&remove=1', action: 'remove', id: 119727},
					{data: 'id=119728&remove=1', action: 'remove', id: 119728},
					{data: 'id=119729&remove=1', action: 'remove', id: 119729},
					{data: 'id=119730&remove=1', action: 'remove', id: 119730},
					{data: 'id=2784&remove=1', action: 'remove', id: 2784},
					{data: 'id=119731&remove=1', action: 'remove', id: 119731},
					{data: 'id=119732&remove=1', action: 'remove', id: 119732},
					{data: 'id=119733&remove=1', action: 'remove', id: 119733},
					{data: 'id=119734&remove=1', action: 'remove', id: 119734},
					{data: 'id=119735&remove=1', action: 'remove', id: 119735},
					{data: 'id=3267&itemtype=53', action: 'update', id: 3267},
					{data: 'id=3397&remove=1', action: 'remove', id: 3397},
					{data: 'id=119736&remove=1', action: 'remove', id: 119736},
					{data: 'id=119737&remove=1', action: 'remove', id: 119737},
					{data: 'id=119738&remove=1', action: 'remove', id: 119738},
					{data: 'id=119739&remove=1', action: 'remove', id: 119739},
					{data: 'id=119740&remove=1', action: 'remove', id: 119740},
					{data: 'id=4142&itemtype=53', action: 'update', id: 4142},
					{data: 'id=4168&remove=1', action: 'remove', id: 4168},
					{data: 'id=4353&remove=1', action: 'remove', id: 4353},
					{data: 'id=119741&remove=1', action: 'remove', id: 119741},
					{data: 'id=119742&remove=1', action: 'remove', id: 119742},
					{data: 'id=4436&itemtype=397', action: 'update', id: 4436},
					{data: 'id=119743&remove=1', action: 'remove', id: 119743},
					{data: 'id=119744&remove=1', action: 'remove', id: 119744},
					{data: 'id=119745&remove=1', action: 'remove', id: 119745},
					{data: 'id=4957&itemtype=53', action: 'update', id: 4957},
					{data: 'id=4983&remove=1', action: 'remove', id: 4983},
					{data: 'id=5123&remove=1', action: 'remove', id: 5123},
					{data: 'id=119746&remove=1', action: 'remove', id: 119746},
					{data: 'id=119747&remove=1', action: 'remove', id: 119747},
					{data: 'id=119748&remove=1', action: 'remove', id: 119748},
					{data: 'id=119749&remove=1', action: 'remove', id: 119749},
					{data: 'id=119750&remove=1', action: 'remove', id: 119750},
					{data: 'id=5499&itemtype=53', action: 'update', id: 5499},
					{data: 'id=5525&remove=1', action: 'remove', id: 5525},
					{data: 'id=5627&remove=1', action: 'remove', id: 5627},
					{data: 'id=119751&remove=1', action: 'remove', id: 119751},
					{data: 'id=119752&remove=1', action: 'remove', id: 119752},
					{data: 'id=119753&remove=1', action: 'remove', id: 119753},
					{data: 'id=119754&remove=1', action: 'remove', id: 119754},
					{data: 'id=119755&remove=1', action: 'remove', id: 119755},
					{data: 'id=6206&itemtype=53', action: 'update', id: 6206},
					{data: 'id=6225&remove=1', action: 'remove', id: 6225},
					{data: 'id=6353&remove=1', action: 'remove', id: 6353},
					{data: 'id=119756&remove=1', action: 'remove', id: 119756},
					{data: 'id=119757&remove=1', action: 'remove', id: 119757},
					{data: 'id=119758&remove=1', action: 'remove', id: 119758},
					{data: 'id=119759&remove=1', action: 'remove', id: 119759},
					{data: 'id=15003&remove=1', action: 'remove', id: 15003},
					{data: 'id=12537&remove=1', action: 'remove', id: 12537},
					{data: 'id=119760&remove=1', action: 'remove', id: 119760},
					{data: 'id=119761&remove=1', action: 'remove', id: 119761},
					{data: 'id=12625&remove=1', action: 'remove', id: 12625},
					{data: 'id=119762&remove=1', action: 'remove', id: 119762},
					{data: 'id=119763&remove=1', action: 'remove', id: 119763},
					{data: 'id=4772&remove=1', action: 'remove', id: 4772},
					{data: 'id=119764&remove=1', action: 'remove', id: 119764},
					{data: 'id=119765&remove=1', action: 'remove', id: 119765},
					{data: 'id=119766&remove=1', action: 'remove', id: 119766},
					{data: 'id=119767&remove=1', action: 'remove', id: 119767},
					{data: 'id=14615&remove=1', action: 'remove', id: 14615},
					{data: 'id=119768&remove=1', action: 'remove', id: 119768},
					{data: 'id=119769&remove=1', action: 'remove', id: 119769},
					{data: 'id=119770&remove=1', action: 'remove', id: 119770},
					{data: 'id=119771&remove=1', action: 'remove', id: 119771},
					{data: 'id=119772&remove=1', action: 'remove', id: 119772},
					{data: 'id=11193&remove=1', action: 'remove', id: 11193},
					{data: 'id=11255&remove=1', action: 'remove', id: 11255},
					{data: 'id=10037&remove=1', action: 'remove', id: 10037},
					{data: 'id=119773&remove=1', action: 'remove', id: 119773},
					{data: 'id=119774&remove=1', action: 'remove', id: 119774},
					{data: 'id=119775&remove=1', action: 'remove', id: 119775},
					{data: 'id=119776&remove=1', action: 'remove', id: 119776},
					{data: 'id=119777&remove=1', action: 'remove', id: 119777},
					{data: 'id=8906&itemtype=53', action: 'update', id: 8906},
					{data: 'id=8932&remove=1', action: 'remove', id: 8932},
					{data: 'id=9039&remove=1', action: 'remove', id: 9039},
					{data: 'id=119778&remove=1', action: 'remove', id: 119778},
					{data: 'id=119779&remove=1', action: 'remove', id: 119779},
					{data: 'id=119780&remove=1', action: 'remove', id: 119780},
					{data: 'id=119781&remove=1', action: 'remove', id: 119781},
					{data: 'id=3858&remove=1', action: 'remove', id: 3858},
					{data: 'id=3964&remove=1', action: 'remove', id: 3964},
					{data: 'id=119782&remove=1', action: 'remove', id: 119782},
					{data: 'id=119783&remove=1', action: 'remove', id: 119783},
					{data: 'id=119784&remove=1', action: 'remove', id: 119784},
					{data: 'id=119785&remove=1', action: 'remove', id: 119785},
					{data: 'id=119786&remove=1', action: 'remove', id: 119786},
					{data: 'id=10476&itemtype=53', action: 'update', id: 10476},
					{data: 'id=10560&remove=1', action: 'remove', id: 10560},
					{data: 'id=119787&remove=1', action: 'remove', id: 119787},
					{data: 'id=119788&remove=1', action: 'remove', id: 119788},
					{data: 'id=119789&remove=1', action: 'remove', id: 119789},
					{data: 'id=119790&remove=1', action: 'remove', id: 119790},
					{data: 'id=119791&remove=1', action: 'remove', id: 119791},
					{data: 'id=5810&itemtype=53', action: 'update', id: 5810},
					{data: 'id=5831&remove=1', action: 'remove', id: 5831},
					{data: 'id=5881&remove=1', action: 'remove', id: 5881},
					{data: 'id=119792&remove=1', action: 'remove', id: 119792},
					{data: 'id=11098&remove=1', action: 'remove', id: 11098},
					{data: 'id=119793&remove=1', action: 'remove', id: 119793},
					{data: 'id=13042&itemtype=53', action: 'update', id: 13042},
					{data: 'id=13087&remove=1', action: 'remove', id: 13087},
					{data: 'id=1496&remove=1', action: 'remove', id: 1496},
					{data: 'id=119794&remove=1', action: 'remove', id: 119794},
					{data: 'id=119795&remove=1', action: 'remove', id: 119795},
					{data: 'id=119796&remove=1', action: 'remove', id: 119796},
					{data: 'id=119797&remove=1', action: 'remove', id: 119797},
					{data: 'id=119798&remove=1', action: 'remove', id: 119798},
					{data: 'id=14359&remove=1', action: 'remove', id: 14359},
					{data: 'id=8328&remove=1', action: 'remove', id: 8328},
					{data: 'id=8384&remove=1', action: 'remove', id: 8384},
					{data: 'id=119799&remove=1', action: 'remove', id: 119799},
					{data: 'id=7024&itemtype=53', action: 'update', id: 7024},
					{data: 'id=7050&remove=1', action: 'remove', id: 7050},
					{data: 'id=7152&remove=1', action: 'remove', id: 7152},
					{data: 'id=119800&remove=1', action: 'remove', id: 119800},
					{data: 'id=119801&remove=1', action: 'remove', id: 119801},
					{data: 'id=119802&remove=1', action: 'remove', id: 119802},
					{data: 'id=1313&remove=1', action: 'remove', id: 1313},
					{data: 'id=119803&remove=1', action: 'remove', id: 119803},
					{data: 'id=7951&remove=1', action: 'remove', id: 7951},
					{data: 'id=12962&remove=1', action: 'remove', id: 12962},
					{data: 'id=3096&remove=1', action: 'remove', id: 3096},
					{data: 'id=119804&remove=1', action: 'remove', id: 119804},
					{data: 'id=119805&remove=1', action: 'remove', id: 119805},
					{data: 'id=119806&remove=1', action: 'remove', id: 119806},
					{data: 'id=14081&remove=1', action: 'remove', id: 14081},
					{data: 'id=96798&remove=1', action: 'remove', id: 96798},
					{data: 'id=96799&remove=1', action: 'remove', id: 96799},
					{data: 'id=8813&remove=1', action: 'remove', id: 8813},
					{data: 'id=8867&remove=1', action: 'remove', id: 8867},
					{data: 'id=12052&remove=1', action: 'remove', id: 12052},
					{data: 'id=119807&remove=1', action: 'remove', id: 119807},
					{data: 'id=119808&remove=1', action: 'remove', id: 119808},
					{data: 'id=12141&remove=1', action: 'remove', id: 12141},
					{data: 'id=119809&remove=1', action: 'remove', id: 119809},
					{data: 'id=119810&remove=1', action: 'remove', id: 119810},
					{data: 'id=13807&remove=1', action: 'remove', id: 13807},
					{data: 'id=119811&remove=1', action: 'remove', id: 119811},
					{data: 'id=119812&remove=1', action: 'remove', id: 119812},
					{data: 'id=13893&remove=1', action: 'remove', id: 13893},
					{data: 'id=119813&remove=1', action: 'remove', id: 119813},
					{data: 'id=119814&remove=1', action: 'remove', id: 119814},
					{data: 'id=119815&remove=1', action: 'remove', id: 119815},
					{data: 'id=7407&itemtype=53', action: 'update', id: 7407},
					{data: 'id=7433&remove=1', action: 'remove', id: 7433},
					{data: 'id=7578&remove=1', action: 'remove', id: 7578},
					{data: 'id=119816&remove=1', action: 'remove', id: 119816},
					{data: 'id=119817&remove=1', action: 'remove', id: 119817},
					{data: 'id=119818&remove=1', action: 'remove', id: 119818},
					{data: 'id=119819&remove=1', action: 'remove', id: 119819},
					{data: 'id=119820&remove=1', action: 'remove', id: 119820},
					{data: 'id=12818&remove=1', action: 'remove', id: 12818},
					{data: 'id=119821&remove=1', action: 'remove', id: 119821},
					{data: 'id=6815&itemtype=53', action: 'update', id: 6815},
					{data: 'id=6893&remove=1', action: 'remove', id: 6893},
					{data: 'id=119822&remove=1', action: 'remove', id: 119822},
					{data: 'id=119823&remove=1', action: 'remove', id: 119823},
					{data: 'id=13534&itemtype=53', action: 'update', id: 13534},
					{data: 'id=13577&remove=1', action: 'remove', id: 13577},
					{data: 'id=9749&itemtype=80', action: 'update', id: 9749},
					{data: 'id=9829&remove=1', action: 'remove', id: 9829},
					{data: 'id=976&remove=1', action: 'remove', id: 976},
					{data: 'id=3693&remove=1', action: 'remove', id: 3693},
					{data: 'id=119824&remove=1', action: 'remove', id: 119824},
					{data: 'id=8641&remove=1', action: 'remove', id: 8641},
					{data: 'id=119825&remove=1', action: 'remove', id: 119825},
					{data: 'id=13431&remove=1', action: 'remove', id: 13431},
					{data: 'id=119826&remove=1', action: 'remove', id: 119826},
					{data: 'id=8485&remove=1', action: 'remove', id: 8485},
					{data: 'id=6075&remove=1', action: 'remove', id: 6075},
					{data: 'id=119827&remove=1', action: 'remove', id: 119827},
					{data: 'id=9257&remove=1', action: 'remove', id: 9257},
					{data: 'id=119828&remove=1', action: 'remove', id: 119828},
					{data: 'id=9464&itemtype=53', action: 'update', id: 9464},
					{data: 'id=9517&remove=1', action: 'remove', id: 9517},
					{data: 'id=119829&remove=1', action: 'remove', id: 119829},
					{data: 'id=7799&remove=1', action: 'remove', id: 7799},
					{data: 'id=10346&remove=1', action: 'remove', id: 10346},
					{data: 'id=11564&remove=1', action: 'remove', id: 11564},
					{data: 'id=119830&remove=1', action: 'remove', id: 119830},
					{data: 'id=119831&remove=1', action: 'remove', id: 119831},
					{data: 'id=11731&remove=1', action: 'remove', id: 11731},
					{data: 'id=9374&remove=1', action: 'remove', id: 9374},
					{data: 'id=10794&remove=1', action: 'remove', id: 10794},
					{data: 'id=119832&remove=1', action: 'remove', id: 119832},
					{data: 'id=6664&itemtype=53', action: 'update', id: 6664},
					{data: 'id=6681&remove=1', action: 'remove', id: 6681},
					{data: 'id=6727&remove=1', action: 'remove', id: 6727},
					{data: 'id=119833&remove=1', action: 'remove', id: 119833},
					{data: 'id=10960&remove=1', action: 'remove', id: 10960},
					{data: 'id=119834&remove=1', action: 'remove', id: 119834},
					{data: 'id=9654&remove=1', action: 'remove', id: 9654},
					{data: 'id=119835&remove=1', action: 'remove', id: 119835},
					{data: 'id=5391&remove=1', action: 'remove', id: 5391},
					{data: 'id=119836&remove=1', action: 'remove', id: 119836},
					{data: 'id=6527&itemtype=53', action: 'update', id: 6527},
					{data: 'id=6573&remove=1', action: 'remove', id: 6573},
					{data: 'id=119837&remove=1', action: 'remove', id: 119837},
					{data: 'id=119838&remove=1', action: 'remove', id: 119838},
					{data: 'id=13175&itemtype=53', action: 'update', id: 13175},
					{data: 'id=13190&remove=1', action: 'remove', id: 13190},
					{data: 'id=13259&remove=1', action: 'remove', id: 13259},
					{data: 'id=14823&remove=1', action: 'remove', id: 14823},
					{data: 'id=119839&remove=1', action: 'remove', id: 119839},
					{data: 'id=2123&itemtype=53', action: 'update', id: 2123},
					{data: 'id=102072&remove=1', action: 'remove', id: 102072},
					{data: 'id=2149&remove=1', action: 'remove', id: 2149},
					{data: 'id=2319&remove=1', action: 'remove', id: 2319},
					{data: 'id=119840&remove=1', action: 'remove', id: 119840},
					{data: 'id=119841&remove=1', action: 'remove', id: 119841},
					{data: 'id=2402&itemtype=397', action: 'update', id: 2402},
					{data: 'id=119842&remove=1', action: 'remove', id: 119842},
					{data: 'id=119843&remove=1', action: 'remove', id: 119843},
					{data: 'id=11391&remove=1', action: 'remove', id: 11391},
					{data: 'id=12346&remove=1', action: 'remove', id: 12346},
					{data: 'id=119844&remove=1', action: 'remove', id: 119844},
					{data: 'id=14916&remove=1', action: 'remove', id: 14916},
					{data: 'id=517&remove=1', action: 'remove', id: 517},
					{data: 'id=119845&remove=1', action: 'remove', id: 119845},
					{data: 'id=119846&remove=1', action: 'remove', id: 119846},
					{data: 'id=119847&remove=1', action: 'remove', id: 119847},
					{data: 'id=119848&remove=1', action: 'remove', id: 119848},
					{data: 'id=119849&remove=1', action: 'remove', id: 119849},
					{data: 'id=93763&remove=1', action: 'remove', id: 93763},
					{data: 'id=89502&remove=1', action: 'remove', id: 89502},
					{data: 'id=93436&remove=1', action: 'remove', id: 93436},
					{data: 'id=93583&remove=1', action: 'remove', id: 93583},
					{data: 'id=119850&remove=1', action: 'remove', id: 119850},
					{data: 'id=95081&remove=1', action: 'remove', id: 95081},
					{data: 'id=95095&remove=1', action: 'remove', id: 95095},
					{data: 'id=95138&remove=1', action: 'remove', id: 95138},
					{data: 'id=96239&remove=1', action: 'remove', id: 96239},
					{data: 'id=119851&remove=1', action: 'remove', id: 119851},
					{data: 'id=99938&remove=1', action: 'remove', id: 99938},
					{data: 'id=100048&remove=1', action: 'remove', id: 100048},
					{data: 'id=119852&remove=1', action: 'remove', id: 119852},
					{data: 'id=103337&remove=1', action: 'remove', id: 103337},
					{data: 'id=119853&remove=1', action: 'remove', id: 119853},
					{data: 'id=101467&remove=1', action: 'remove', id: 101467},
					{data: 'id=101609&remove=1', action: 'remove', id: 101609},
					{data: 'id=104900&remove=1', action: 'remove', id: 104900},
					{data: 'id=109027&remove=1', action: 'remove', id: 109027},
					{data: 'id=109399&remove=1', action: 'remove', id: 109399},
					{data: 'id=119854&remove=1', action: 'remove', id: 119854},
					{data: 'id=108178&remove=1', action: 'remove', id: 108178},
					{data: 'id=119855&remove=1', action: 'remove', id: 119855},
					{data: 'id=119856&remove=1', action: 'remove', id: 119856},
					{data: 'id=109761&remove=1', action: 'remove', id: 109761},
					{data: 'id=108530&remove=1', action: 'remove', id: 108530},
					{data: 'id=119857&remove=1', action: 'remove', id: 119857},
					{data: 'id=119858&remove=1', action: 'remove', id: 119858},
					{data: 'id=109925&remove=1', action: 'remove', id: 109925},
					{data: 'id=119859&remove=1', action: 'remove', id: 119859},
					{data: 'id=110118&remove=1', action: 'remove', id: 110118},
					{data: 'id=113958&remove=1', action: 'remove', id: 113958},
					{data: 'id=119860&remove=1', action: 'remove', id: 119860},
					{data: 'id=119861&remove=1', action: 'remove', id: 119861},
					{data: 'id=119862&remove=1', action: 'remove', id: 119862},
					{data: 'id=119863&remove=1', action: 'remove', id: 119863},
					{data: 'id=114262&remove=1', action: 'remove', id: 114262},
					{data: 'id=119864&remove=1', action: 'remove', id: 119864},
					{data: 'id=99288&remove=1', action: 'remove', id: 99288},
					{data: 'id=101272&remove=1', action: 'remove', id: 101272},
					{data: 'id=104103&remove=1', action: 'remove', id: 104103},
					{data: 'id=104101&itemtype=53', action: 'update', id: 104101},
					{data: 'id=107235&remove=1', action: 'remove', id: 107235},
					{data: 'id=107251&remove=1', action: 'remove', id: 107251},
					{data: 'id=114576&remove=1', action: 'remove', id: 114576},
					{data: 'id=115849&remove=1', action: 'remove', id: 115849},
					{data: 'id=116837&remove=1', action: 'remove', id: 116837}
				];

				oParam.updateRows = aUpdateRows;
				fCallBack(oParam, fCallBack, fCallBackProcess);
			}

			else if (oParam.processingStep === 1)
			{
				if (oParam.updateIndex == undefined) {oParam.updateIndex = 0}

				if (oParam.updateIndex < oParam.updateRows2.length)
				{
					var oThisRow = oParam.updateRows2[oParam.updateIndex];
					sData = oThisRow.data;

					console.log(oThisRow.action + ' id ' + oThisRow.id);
					oParam.logHTML.push(oThisRow.action + ' id ' + oThisRow.id);

					if (!bTesting)
					{
						oParam.ajax = {};
						oParam.ajax.type = 'POST';
						oParam.ajax.url = '/ondemand/audit/?method=AUDIT_ITEM_TYPE_MANAGE&rf=JSON' +
											'&logonkey=' + oParam.settings.user.logonkey + '&sid=' + oParam.settings.user.sid;
						oParam.ajax.data = sData;
						oParam.ajax.success = function(bErr, oResponse, oParam)
						{
							//debugger;
							if (!bErr && oResponse.status === 'OK')
							{
								oParam.updateIndex += 1;
							}
							else
							{
								oParam.logHTML.push("Error " + oThisRow.action + " " + oThisRow.id + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								console.log("Error " + oThisRow.action + " " + oThisRow.id + ": " + ((oResponse && oResponse.status === 'ER') ? oResponse.error.errornotes : ''));
								oParam.processingStep = -1;
							}
							fCallBack(oParam, fCallBack, fCallBackProcess);
						}
						myJquery.ajax(oParam);
					}
					else
					{
						oParam.updateIndex += 1;
						fCallBack(oParam, fCallBack, fCallBackProcess);
					}

				}
				else
				{
					delete(oParam.updateIndex);
					oParam.processingStep = 10;
					fCallBack(oParam, fCallBack, fCallBackProcess);
				}
			}

			// All done sucessfully
			else if (oParam.processingStep === 10 || oParam.processingStep === -1)
			{
				delete(oParam.currentObject);
				oParam.errorOccurred = (oParam.processingStep === -1);
				sciqual.sendLogFile(oParam);
			}
		}
	}
}



# Energy measurement sensor
## Background
This document defines the technical requirements for selecting and implementing a new energy measurement sensor.
The purpose is to accurately obtain voltage, current, and power consumption in the actual operational environment.
## Purpose
Clearly define the criteria for sensor selection.

Ensure a shared understanding among the development and implementation teams.

Use this document for stakeholder approval.
## Scope
In scope
- Communication requirements
- Environmental requirements
- Organization of sensor candidates
- Finalization of the sensor configuration
Out scope
- Sensor installation work.
- Mass‑production design.
- Detailed network construction.
## Prerequisites
The measurement target is a commercial power supply (100V).

Indoor and basement usage is assumed.

Data will be transmitted over a closed network.
## Technical requirements
Communication interface requirements.
- Communication method: BLE or Wifi
- Required bandwidth: 2.4 GHz
- Connection stability criteria: Packet loss < 1%
- Redundancy requirement: Not required for this PoC

Environmental Requirements
- Temperture range: -10〜50°C (FYI [Mishima City(near Susono) weather data](https://www.data.jma.go.jp/stats/etrn/view/annually_s.php?prec_no=50&block_no=47657&year=&month=&day=&view=)(気象庁))
- Humdity range: 20〜80%(FYI [Mishima City(near Susono) humidity data](https://www.data.jma.go.jp/stats/etrn/view/annually_s.php?prec_no=50&block_no=47657&year=&month=&day=&view=)(気象庁))
- Vibration conditions: None
- Electric noise conditions: Power supply noise
- Required dust‑ and water‑resistance level: More than IP00 level. (FYI [IP規格](https://www.os-prod.com/signage/housing/ip.html))

Sensor specification requirements
- Measurement range: AC 0.5A-15A
- Measurement resolution: 0.1A
- Measurement temperature coefficient: None
- Measurement response time: None
- Measurement accuracy:
-   Absolute values are not guaranteed for this PoC.(e.g. FS±2%)
-   Relative values are targeted (around ±1%).
- Sampling interval: Once every 30 minutes -> 見直すかも
- Measured items: Converted current values (current converted to voltage)
- Measurement method: Clamp‑type CT sensor
- Installation location: 100V input side of [OrionAutoCraft DC24‑30](https://orionac.jp/ep/ep24-30/)
<img width="1362" height="378" alt="image" src="https://github.com/user-attachments/assets/1400a85d-8648-4ef7-8d6e-0653b4324360" />

- Installation requirements: There must be a section where the outer PVC jacket is removed.
(Measurement is performed by clamping over the innSafety requirementser wire’s PVC insulation.)
<img width="355" height="311" alt="image" src="https://github.com/user-attachments/assets/9a39b77e-53fa-4a98-9886-76f618b209c9" />

- Electrical safety (insulation, withstand voltage): Not considered for this PoC.
		->これむずい。計測できる環境がない＆環境構築に金かかる or EAS に相談
- Regulatory compliance: Must have [Giteki](https://www.tele.soumu.go.jp/giteki/SearchServlet?pageID=js01) and [PSEmarks](https://www.jqa.jp/service_list/safety/service/mandatory/pse/).
Security Requirements
- Data encryption: Not considered for this PoC.
- Authentication method: Not considered for this PoC.
- Network isolation requirement: Sensor devices will not be connected to the network.
## Sensor candidates
More than cheaper ideas.(ref: [Lucid](https://lucid.app/lucidspark/28c43e58-6eea-4c1d-a9f0-2e8e8a8fdb35/edit?view_items=8nbpSN9cBHcq&page=0_0&invitationId=inv_71d478db-a83c-433d-ba3c-42a568972edf))
- [Analog AC Current Sensor](https://www.switch-science.com/products/5072?srsltid=AfmBOooI_UEOP7NfTGohUyXkmCOeAJjq2O4J4VgI7CzAFqwU6wAv7pxz) + [Seeed Studio XIAO ESP32C3](https://www.switch-science.com/products/8348?srsltid=AfmBOoqHY2_B4-ia9YS4y61HiH_WK8xABkQAUvLZZpKCaQa_DvudZRiy)
<img width="1368" height="440" alt="image" src="https://github.com/user-attachments/assets/38666147-229f-4e26-811d-b766113d548d" />

-   Sensor model: DFROBOT-SEN0211
-   Cost :3,756yen + 1,095yen = 4,851yen
-   Safety risk: electric shock->low
-   Leadtime: Low domestic stock and long lead time
- [高精度電流センサー(CTセンサー・変流器) 80A Φ10mm 分割型](https://akizukidenshi.com/catalog/g/g108960/) +
[CT sensor amplifier board](https://www.switch-science.com/products/7559?srsltid=AfmBOorJSBRVB3owrpN14BKCXK58_IftWvLCppJOK-FJvyJywcoUcTfu) + [Seeed Studio XIAO ESP32C3](https://www.switch-science.com/products/8348?srsltid=AfmBOoqHY2_B4-ia9YS4y61HiH_WK8xABkQAUvLZZpKCaQa_DvudZRiy)
<img width="1412" height="454" alt="image" src="https://github.com/user-attachments/assets/73d3776c-08b3-49af-8866-3be5914833ca" />

-   Sensor model: SR-3704-150N
-   Cost :1,100yen + 4,400yen + 1,095yen = 6,595yen
-   Safety risk: electric shock -> low
-   Leadtime: Although the quantity is limited, it is available in the domestic market and can be procured.
It may be expensive, but highly accurate item.
- [IoT電力センサユニット DDS13シリーズ](https://www.monotaro.com/p/8068/2195/)(FYI：[PDF](https://drive.google.com/file/d/1-wzKWbTynRJxZM0iQ8jcODXYtbFip_JV/view?usp=drive_link) )
<img width="1063" height="747" alt="image" src="https://github.com/user-attachments/assets/dd27eeab-59c4-4fc0-acc9-4f651623f167" />

-   Cost: About 90,000 yen
-   Safety RISK: None
-   Leadtime: Soon
Middle range items.(outlet connection type)
- SwitchBot
<img width="924" height="464" alt="image" src="https://github.com/user-attachments/assets/2487063d-a061-4294-a0b0-08361a55f50b" />

-   Cost: 2,000 yen+ (electronic code + plug = about 2,000yen) = 4,000 yen
-   Safety risk: Custom made outlet shape conversion plug, because earth requirement under considerationa.->Electric shock low-mid
-   Leadtime: Soon
- [Wi-Fiワットチェッカー](https://www.ratocsystems.com/topics/newproduct/20240620/)
<img width="875" height="440" alt="image" src="https://github.com/user-attachments/assets/43616ed9-3123-4324-a6ba-2941c5a1ef33" />

-   Cost: 6,980 yen + (electronic code + plug = about 2,000yen) = 8,980 yen
-   Safety risk: Custom made outlet shape conversion plug, because earth requirement under considerationa.->Electric shock low-mid
-   Leadtime: Soon
**Option module comparative quotation**

| Option name    | Risk    | Cost    | Leadtime    |
| ---- | ---- | ---- | ---- |
|     [Analog AC Current Sensor](https://www.switch-science.com/products/5072?srsltid=AfmBOooI_UEOP7NfTGohUyXkmCOeAJjq2O4J4VgI7CzAFqwU6wAv7pxz)|Electric shock-> low| 4,851 yen    | Late    |
|     [高精度電流センサー(CTセンサー・変流器) 80A Φ10mm 分割型](https://akizukidenshi.com/catalog/g/g108960/)|     Electric shock-> low| 6,595 yen    | Soon    |
|     [SwitchBot](https://www.switchbot.jp/pages/switchbot-plug-mini?srsltid=AfmBOoqgMJExbtK2j70i_pV0Zl7doLCS0G6GsZXwdxwCPfSGMYKBwssH)|     Electric shock-> low-mid| 4,000 yen    | Soon    |
|     [Wi-Fiワットチェッカー](https://www.ratocsystems.com/topics/newproduct/20240620/)|     Electric shock-> low-mid| 8,980 yen    | Soon    |
|     [IoT電力センサユニット DDS13シリーズ](https://www.monotaro.com/p/8068/2195/)|Electric shock-> low| 90,000 yen    | Soon    |
## In conclusion
I personally purchased both, but the one above will arrive late.

The one below is expected to arrive on the 22nd.

I would like to proceed with the on-site testing using one of these.


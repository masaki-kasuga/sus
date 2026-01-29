# Network Architecture for IoT Devices in LOP
This documentation records the progress of the development of the Network Architecture for the IoT devices at Genba site.
## Utilized Service and Application:

### Soracom Virtual Private Gateway (VPG)
Soracom VPG is a dedicated private network environment within Soracom. It can enable blocking access to and from public internet while allowing outbound filters. This helps ensure secured device-to-device communication.
We are currently using Soracom VPG service to orchestrate network communications between devices in Genba site. 
### Eclipse Mosquitto
Eclipse Mosquitto is used as the MQTT Broker. It is a popular open source message broker that implements all the MQTT security protocols and easy to use.
## Network diagram
![Q4 Memo - ___ 1 Soracom detailed network diagram](https://github.com/user-attachments/assets/31d4cf1c-6baa-4962-93c7-151f19289e43)
## Security measures
### Within devices
#### MQTT Authentication:
Authentication is setup within MQTT at `/etc/mosquitto/passwd/mpasswd`
#### Access Control file (ACL):
Authentication credentials is binded to respective read/ write permissions on specified topics in the acl file at `/etc/mosquitto/acl.conf`
#### SSL/TSL Certificates:
SSL/TSL Certificates is used as an extra layer to send/ receive messages within the MQTT. 
#### MQTT log
MQTT log is enabled and is recorded at `/var/log/mosquitto/mosquitto.log`
#### Firewalls:
`ufw` is used to set up firewall between devices to ensure only connections between publisher and subscriber is allowed. (Disabled during development)
### Within Soracom VPG
#### Block outbound to the Internet except to IoTA
Deny access to 0.0.0.0/0 and allow access to 6 IPs given by IoTA team to ensure access to IoTA is whitelisted. (Disabled during development)

<img width="1602" height="415" alt="image" src="https://github.com/user-attachments/assets/5fcca6a0-1252-461b-a988-ce5a8338390a" />
#### Logging and monitoring
Within Soracom, there available existing logging functionality for:

<img width="300" height="215" alt="image" src="https://github.com/user-attachments/assets/02d77e24-1520-465e-82df-3e7126a88765" />

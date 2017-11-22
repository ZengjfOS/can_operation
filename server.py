#!/usr/bin/python3

from websocket_server import WebsocketServer
import os;
import can;
import time;
import json;
import _thread as thread; 
from multiprocessing import Queue;
import queue

DO_num = 0;

can_messages = Queue(maxsize = 100)
can_messages_send = Queue(maxsize = 100)

'''
hardware_ctl_data = {
    "hardware_ctl" : {
        "dev_name": "can0",
        "baud_rate" : 1000000,
        "bits"     : 8,
        "send_data" : 0,
        "recv_data" : 0,
        "ctl_id" : 0,
        "behavior" : 0,
        "start_bit": 0
        }
    }
'''

# python-can-socket
can.rc['interface'] = 'socketcan_native'
can.rc['channel'] = 'can0'
can.rc['bitrate'] = 1000000
from can.interfaces.interface import Bus

# python-can set-up
def can_setup(can_name, can_baud_rate):
    can_setup_command = "canconfig " + can_name + " bitrate " + can_baud_rate +" restart-ms 1000 ctrlmode triple-sampling on";
    can_start_command = "canconfig " + can_name + " start";
    can.rc['channel'] = can_name;
    can.rc['bitrate'] = int(can_baud_rate);
    pass;
    os.system(can_setup_command);
    os.system(can_start_command);

# python-can stop
def can_stop(can_name):
    can_stop_command = "canconfig " + can_name + " stop";
    os.system(can_stop_command);

# python-can send msg
def can_send_msg(ctl_id, ctl_data):
    bus = can.interface.Bus();
    msg = can.Message(arbitration_id = ctl_id,
            data=[ctl_data, 0, 0, 0, 0, 0, 0, 0],
            extended_id = False);
    try:
        bus.send(msg);
    except can.CanError:
        print("Message NOT sent");

# python-can recv msg
def can_recv_msg():
    msg = None;
    bus = can.interface.Bus();
    try:
        msg = bus.recv(0.5);
        return msg;
    except can.CanError:
        print("Message NOT rese");
        return None ;

def send_receive_can_data(name, arg):
    print("send receive thread");
    while True:
        if can_messages_send.empty() != True: 
            hardware_ctl_data = can_messages_send.get();
            can_behavior = hardware_ctl_data["hardware_ctl"]["behavior"];
            ctl_id = hardware_ctl_data["hardware_ctl"]["ctl_id"] | (can_behavior << 7 )
            ctl_data = hardware_ctl_data["hardware_ctl"]["send_data"]
            # print("id: %d, data: %d, queue length" % (ctl_id, ctl_data));
            can_send_msg(ctl_id, ctl_data);
            if (hardware_ctl_data["hardware_ctl"]["behavior"] == 1):
                hardware_ctl_data["hardware_ctl"]["recv_data"] = 0;
                msg = can_recv_msg();
                if (msg):
                    hardware_ctl_data["hardware_ctl"]["recv_data"] = msg.data[0];
                    hardware_ctl_data["hardware_ctl"]["ctl_id"] = msg.arbitration_id & 0x7f;
                    hardware_ctl_data["hardware_ctl"]["behavior"] = 1;
                    server.send_message_to_all(json.dumps(hardware_ctl_data));
                else:
                    print("recvf errno");
            elif (hardware_ctl_data["hardware_ctl"]["behavior"] == 2):
                server.send_message_to_all(json.dumps(hardware_ctl_data));

            time.sleep(0.2);

            continue

        if can_messages.empty() != True:
            hardware_ctl_data = can_messages.get();
            can_behavior = hardware_ctl_data["hardware_ctl"]["behavior"];
            ctl_id = hardware_ctl_data["hardware_ctl"]["ctl_id"] | (can_behavior << 7 )
            ctl_data = hardware_ctl_data["hardware_ctl"]["send_data"]
            # print("id: %d, data: %d, queue length" % (ctl_id, ctl_data));
            can_send_msg(ctl_id, ctl_data);
            if (hardware_ctl_data["hardware_ctl"]["behavior"] == 1):
                hardware_ctl_data["hardware_ctl"]["recv_data"] = 0;
                msg = can_recv_msg();
                if (msg):
                    hardware_ctl_data["hardware_ctl"]["recv_data"] = msg.data[0];
                    hardware_ctl_data["hardware_ctl"]["ctl_id"] = msg.arbitration_id & 0x7f;
                    hardware_ctl_data["hardware_ctl"]["behavior"] = 1;
                    server.send_message_to_all(json.dumps(hardware_ctl_data));
                else:
                    print("recvf errno");
            elif (hardware_ctl_data["hardware_ctl"]["behavior"] == 2):
                server.send_message_to_all(json.dumps(hardware_ctl_data));

            time.sleep(0.2);
        else:
            time.sleep(0.01);

def get_current_status_can_data(name, arg):
    print("send receive thread");
    while True:
        '''
        hardware_ctl_data = {
            "hardware_ctl" : {
                "dev_name": "can0",
                "baud_rate" : 1000000,
                "bits"     : 8,
                "send_data" : 0,
                "recv_data" : 0,
                "ctl_id" : 0,
                "behavior" : 1,
                "start_bit": 1
            }
        }
        '''

        # hardware_ctl_data["hardware_ctl"]["ctl_id"] = 150
        can_messages.put(
            {
                "hardware_ctl" : {
                    "dev_name": "can0",
                    "baud_rate" : 1000000,
                    "bits"     : 8,
                    "send_data" : 0,
                    "recv_data" : 0,
                    "ctl_id" : 11,
                    "behavior" : 1,
                    "start_bit": 1
                }
            })

        # hardware_ctl_data["hardware_ctl"]["ctl_id"] = 139
        can_messages.put( 
            {
                "hardware_ctl" : {
                    "dev_name": "can0",
                    "baud_rate" : 1000000,
                    "bits"     : 8,
                    "send_data" : 0,
                    "recv_data" : 0,
                    "ctl_id" : 22,
                    "behavior" : 1,
                    "start_bit": 1
                }
            })

        time.sleep(0.5);

# websocket
# Called for every client connecting (after handshake)
def new_client(client, server):
    hardware_ctl_data = {
        "hardware_ctl" : {
            "dev_name": "can0",
            "baud_rate" : 1000000,
            "bits"     : 8,
            "send_data" : 0,
            "recv_data" : 0,
            "ctl_id" : 0,
            "behavior" : 0,
            "start_bit": 0
            }
        }
    print("New client connected and was given id %d" % client['id']);
    server.send_message_to_all(json.dumps(hardware_ctl_data));  # send DO_num to clinet to init it

# Called for every client disconnecting
def client_left(client, server):
    print("Client(%d) disconnected" % client['id'])

# Called when a client sends a message
def message_received(client, server, message):
    # global hardware_ctl_data;
    hardware_ctl_data = json.loads(message);

    if ((hardware_ctl_data["hardware_ctl"]["behavior"] == 1) or (hardware_ctl_data["hardware_ctl"]["behavior"] == 2)):
        if (hardware_ctl_data["hardware_ctl"]["ctl_id"]):
            can_id = hardware_ctl_data["hardware_ctl"]["ctl_id"];
        else:
            can_id = 0;

        can_behavior = hardware_ctl_data["hardware_ctl"]["behavior"];
        ctl_id = can_id | (can_behavior << 7 );
        ctl_data = hardware_ctl_data["hardware_ctl"]["send_data"];
        # print("can_id : %d  can_behavior ; %d     ctl_data : %d" % (ctl_id, can_behavior, ctl_data));

        can_messages_send.put(hardware_ctl_data)

# init can
can_setup("can0", "1000000");

thread.start_new_thread(send_receive_can_data, ("Send Receiv Thread", 1))
thread.start_new_thread(get_current_status_can_data, ("get current status can data", 1))

PORT=9001
server = WebsocketServer(PORT, "0.0.0.0")
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
server.run_forever()

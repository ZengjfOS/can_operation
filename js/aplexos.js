var ws;

var hardware_ctl_data11 =
{
    "hardware_ctl" :
    {
        "dev_name": "can0",
        "baud_rate" : 1000000,
        "bits"     : 8,
        "send_data" : 0,
        "recv_data" : 0,
        "ctl_id" : 0,
        "behavior" : 0,   // 1: read, 2: write, 3: start, 4:stop
        "start_bit" : 0
    }
};

var hardware_ctl_data22 =
{
    "hardware_ctl" :
    {
        "dev_name": "can0",
        "baud_rate" : 1000000,
        "bits"     : 8,
        "send_data" : 0,
        "recv_data" : 0,
        "ctl_id" : 0,
        "behavior" : 0,   // 1: read, 2: write, 3: start, 4:stop
        "start_bit" : 0
    }
};

var can_id1 = 11;
var can_id2 = 22;
var conneted = 0;

color_array = ["green", "orange", "blue", "white"];
// websocket init
function init() {
    // Connect to Web Socket
    var ip_addr = document.location.hostname;
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    ws = new WebSocket('ws://' + ip_addr +':9001');

    // Set event handlers.
    ws.onopen = function() {
        conneted = 1;
    };

    ws.onmessage = function(e) {
        var tmp_rev_data = JSON.parse(e.data);  // Get recv data

        //console.log("onmessage "+ tmp_rev_data);
        if (tmp_rev_data["hardware_ctl"]["ctl_id"] == can_id1)
            hardware_ctl_data11["hardware_ctl"]["start_bit"] = tmp_rev_data["hardware_ctl"]["start_bit"];
        else if (tmp_rev_data["hardware_ctl"]["ctl_id"] == can_id2)
            hardware_ctl_data22["hardware_ctl"]["start_bit"] = tmp_rev_data["hardware_ctl"]["start_bit"];


        if (tmp_rev_data["hardware_ctl"]["behavior"] == 1)
        {
            var gpio_in = tmp_rev_data["hardware_ctl"]["recv_data"] & 0xff;

            for (var i = 0; i < 4; i++)
            {
                var img;
                if (tmp_rev_data["hardware_ctl"]["ctl_id"] == can_id1)
                {
                    img = document.getElementsByName("module1_led_" + color_array[i]);
                }
                else if (tmp_rev_data["hardware_ctl"]["ctl_id"] == can_id2)
                {
                    img = document.getElementsByName("module2_led_" + color_array[i]);
                }

                //console.log(img);
                if ((gpio_in >> i) & 1)
                {
                    img[0].src = "img/led_" + color_array[i] + ".png";
                }
                else
                {
                    img[0].src = "img/led_gray.png";
                }
            }
        }
        else if (tmp_rev_data["hardware_ctl"]["behavior"] == 2)
        {
            if (tmp_rev_data["hardware_ctl"]["ctl_id"] == can_id1)
                hardware_ctl_data11["hardware_ctl"]["send_data"] = tmp_rev_data["hardware_ctl"]["send_data"];
            else if (tmp_rev_data["hardware_ctl"]["ctl_id"] == can_id2)
                hardware_ctl_data22["hardware_ctl"]["send_data"] = tmp_rev_data["hardware_ctl"]["send_data"];
        }
    };

    ws.onclose = function() {
    };

    ws.onerror = function(e) {
        console.log(e)
    };
}

function gpio_value(direction, gpio_num, read_write, can_id) {
    console.log(can_id)
    if (can_id == can_id1)
    {
        if (read_write == 2)
        {
            if (direction)
            {
                hardware_ctl_data11["hardware_ctl"]["send_data"] |= (direction << gpio_num);
            }
            else
            {
                var num = 0xff & ~(!direction << gpio_num);
                hardware_ctl_data11["hardware_ctl"]["send_data"] &= num;
            }
        }
        hardware_ctl_data11["hardware_ctl"]["ctl_id"] = can_id;  //can_id

        hardware_ctl_data11["hardware_ctl"]["behavior"] = read_write;   // write read status
    }
    else if (can_id == can_id2)
    {
        if (read_write == 2)
        {
            if (direction)
            {
                hardware_ctl_data22["hardware_ctl"]["send_data"] |= (direction << gpio_num);
            }
            else
            {
                var num = 0xff & ~(!direction << gpio_num);
                hardware_ctl_data22["hardware_ctl"]["send_data"] &= num;
            }
        }
        hardware_ctl_data22["hardware_ctl"]["ctl_id"] = can_id;  //can_id

        hardware_ctl_data22["hardware_ctl"]["behavior"] = read_write;   // write read status
    }
}

function gpio_output_high(gpio_num, can_id) {
    gpio_value(1, gpio_num, 2, can_id);
    if (can_id == can_id1)
        ws.send(JSON.stringify(hardware_ctl_data11));
    else if (can_id == can_id2)
        ws.send(JSON.stringify(hardware_ctl_data22));

    console.log(can_id);
}

function gpio_output_low(gpio_num, can_id) {
    gpio_value(0, gpio_num, 2, can_id);
    if (can_id == can_id1)
        ws.send(JSON.stringify(hardware_ctl_data11));
    else if (can_id == can_id2)
        ws.send(JSON.stringify(hardware_ctl_data22));
}

function get_di_state(can_id){
    gpio_value(0, 0, 1, can_id);
    if (can_id == can_id1)
        ws.send(JSON.stringify(hardware_ctl_data11));
    else if(can_id == can_id2)
        ws.send(JSON.stringify(hardware_ctl_data22));
}

function getFileName(filePath){
    var pos = filePath.lastIndexOf("/");
    return filePath.substring(pos+1);
}

function set_DO_Value(img) {
    var fileName = getFileName(img.src);
    var button_name = getFileName(img.name);
    console.log(button_name);
    console.log(img.name);

    if (fileName == "power_gray.png") {
        if (button_name == "module1_gpio_do1") {
            gpio_output_high(0, can_id1);
        }
        else if (button_name == "module1_gpio_do2") {
            gpio_output_high(1, can_id1);
        }
        else if (button_name == "module1_gpio_do3") {
            gpio_output_high(2, can_id1);
        }
        else if (button_name == "module1_gpio_do4") {
            gpio_output_high(3, can_id1);
        }
        else if (button_name == "module2_gpio_do1") {
            gpio_output_high(0, can_id2);
        }
        else if (button_name == "module2_gpio_do2") {
            gpio_output_high(1, can_id2);
        }
        else if (button_name == "module2_gpio_do3") {
            gpio_output_high(2, can_id2);
        }
        else if (button_name == "module2_gpio_do4") {
            gpio_output_high(3, can_id2);
        }
        img.src = "img/power_blue.png";
    } else {
        if (button_name == "module1_gpio_do1") {
            gpio_output_low(0, can_id1);
        }
        else if (button_name == "module1_gpio_do2") {
            gpio_output_low(1, can_id1);
        }
        else if (button_name == "module1_gpio_do3") {
            gpio_output_low(2, can_id1);
        }
        else if (button_name == "module1_gpio_do4") {
            gpio_output_low(3, can_id1);
        }
        else if (button_name == "module2_gpio_do1") {
            gpio_output_low(0, can_id2);
        }
        else if (button_name == "module2_gpio_do2") {
            gpio_output_low(1, can_id2);
        }
        else if (button_name == "module2_gpio_do3") {
            gpio_output_low(2, can_id2);
        }
        else if (button_name == "module2_gpio_do4") {
            gpio_output_low(3, can_id2);
        }
        img.src = "img/power_gray.png";
    }
}

var send_di_flag = 0;
function timedCount()
{
    if (conneted == 1)
    {
        if (send_di_flag)
        {
            get_di_state(11);
            send_di_flag = !send_di_flag;
        }
        else
        {
            get_di_state(22);
            send_di_flag = !send_di_flag;
        }
    }

    setTimeout("timedCount()", 1000);
}

function can_start_fun() {
    if (hardware_ctl_data11["hardware_ctl"]["start_bit"] == 0)
    {
        hardware_ctl_data11["hardware_ctl"]["dev_name"] = "can0"
        hardware_ctl_data11["hardware_ctl"]["baud_rate"] = 1000000;
        hardware_ctl_data11["hardware_ctl"]["behavior"] = 3;  // start bit

        hardware_ctl_data22["hardware_ctl"]["dev_name"] = "can0"
        hardware_ctl_data22["hardware_ctl"]["baud_rate"] = 1000000;
        hardware_ctl_data22["hardware_ctl"]["behavior"] = 3;  // start bit

        //ws.send(JSON.stringify(hardware_ctl_data11));
        //ws.send(JSON.stringify(hardware_ctl_data22));

        hardware_ctl_data11["hardware_ctl"]["start_bit"] = 1;
        hardware_ctl_data22["hardware_ctl"]["start_bit"] = 1;
    }
}

$(function(){
    function footerPosition(){
        $("footer").removeClass("fixed-bottom");
        var contentHeight = document.body.scrollHeight,//网页正文全文高度
            winHeight = window.innerHeight;//可视窗口高度，不包括浏览器顶部工具栏
        if(!(contentHeight > winHeight)){
            //当网页正文高度小于可视窗口高度时，为footer添加类fixed-bottom
            $("footer").addClass("fixed-bottom");
        }
    }
    init();
    can_start_fun();

    footerPosition();
    $(window).resize(footerPosition);
    // timedCount();

    // auto to center
    if (document.documentElement.clientHeight > 738) {
        $("#sp_spacing_div").height((document.documentElement.clientHeight / 2) - (738 / 2));
    }
});


    /**
     * Created by DirectSEO on 20.10.2015.
     */

    var Imap = Meteor.npmRequire('imap');
    var MailParser  = Meteor.npmRequire("mailparser").MailParser;

    class imap_service {

        constructor(user,password,host,port){

            this.user= user;
            this.pass= password;
            this.host=host;
            this.port=port;
            this.imap = new Imap({
                user: this.user,
                password:  this.pass,
                host: this.host,
                port: this.port
            });
            this.fetched_mails=[];
        }



        open_this_box(box_name,openReadOnly) {
            console.log('oo');
            i= this.imap;
            var t= this;
            var box_n=box_name;
            var ReadOnly = openReadOnly;
            //openBox(< string >mailboxName[, < boolean >openReadOnly=false[, < object >modifiers]], < function >callback)
            this.imap.once('ready', function() {


                i.openBox(box_n, ReadOnly, function(err, box){t.fetch_emails(err, box)});
            });

            this.imap.once('error', function(err) {
                console.log(err);
            });

            this.imap.once('end', function() {

                console.log('$arr_result:',$arr_result);

                console.log('Connection ended');
            });


// return new/total/unseen message in box
            var get_boxes_email = function(){
                this.imap.getBoxes(function more(err, boxes, path) {
                    if (err) throw err;
                    if (!path)
                        path = '';
                    for (var key in boxes) {
                        if (boxes[key].children)
                            more(undefined, boxes[key].children, path + key + boxes[key].delimiter);
                        else {
                            console.log('status: ' + key);
                            imap.status(path + key, function(err, box) {
                                console.log(key, err, box);
                            });
                        }
                    }
                });
            }
        }

        fetch_emails(err, box){
            $arr_result = this.fetched_mails;
            let imap= this.imap;
                    if (err) throw err;
                    //When you need get 5 last email: box.messages.total-5+":*"
                    var f = imap.seq.fetch('1:*', { bodies: '' });
                    var count=0;
                    f.on('message', function(msg, seqno) {

                        var parser = new MailParser();
                        parser.on("headers", function(headers) {

                            //console.log("++Header: " + JSON.stringify(headers));

                            //    $arr_result.push(headers);
                        });
                        parser.on("end", function(msg) {

                            $arr_result.push(msg);
                            //   log(msg,'parser_'+(count++));
                            //  console.log("$$$$Subject: " + msg.subject);
                            //   console.log("$$$$Text: " + msg.text);
                            //    console.log("$$$$Html: " + msg.html);
                            //   $arr_result.push(msg.html);
                        });


                        var prefix = '(#' + seqno + ') ';
                        msg.on('body', function(stream, info) {


                            var buffer = [];
                            stream.on('data', function(chunk) {
                                //console.log('test',chunk.toString('utf8'));
                                buffer.push(chunk.toString('utf8'));
                            });

                            stream.once('end', function() {

                                parser.write(buffer);
                                parser.end();

                                //console.log('-------buffer[0]-------');
                                //console.log(Imap.parseHeader(buffer[0]));
                                //console.log('-------buffer[1]-------');
                                //console.log(Imap.parseHeader(buffer[1]));
                                //console.log('-------buffer[2]-------');
                                //console.log(buffer[2]);
                                //console.log('--------END-------');
                            });


                        });
                        msg.once('attributes', function(attrs) {
                            console.log(prefix + 'Attributes: %s', (attrs, false, 8));
                        });
                        msg.once('end', function() {
                            console.log(prefix + 'Finished');
                        });
                    });
                    f.once('error', function(err) {
                        console.log('Fetch error: ' + err);
                    });
                    f.once('end', function() {

                        console.log('Done fetching all messages!');

                        imap.end();
                    });







        }


        start(){

            this.imap.connect(function(err) {
                if (err) throw err;
            });
        }


    };





    $connect = new imap_service( 'test@directseo.pl','sopocka21','mail.directseo.pl',143);
    $connect.start();
    $connect.open_this_box('INBOX',true);





    Meteor.methods({
        getData:function() {
            return $arr_result;
        }
    });


//this function combine data array ex. create good time and date
    var arr_result_combine = function(arr){

        for(var a=0; a<$arr_result.length; a++){
            var date_recive = moment($arr_result[a].receivedDate).unix();
            var yesterday = moment(new Date((new Date()).valueOf() - 1000*60*60*24*1)).unix();


            console.log( moment().format('m'),moment($arr_result[a].receivedDate).format('m'));
            if(moment().format('D')==moment($arr_result[a].receivedDate).format('D') &&
                moment().format('Y')==moment($arr_result[a].receivedDate).format('Y') &&
                moment().format('m')==moment($arr_result[a].receivedDate).format('m')
            ){

                $arr_result[a].from_now = moment(moment.unix(date_recive)).format('HH:mm:ss');
            }else{
                $arr_result[a].from_now =moment.unix(date_recive).format('L');
            }

        }


    };

    Meteor.publish('emails',function(){

        arr_result_combine($arr_result);
        for(var a=0; a<$arr_result.length; a++){
            this.added("emails", a,$arr_result[a]);
        }


        this.ready();

    });



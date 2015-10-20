Chartdata = new Meteor.Collection("get_res");

if (Meteor.isClient) {




  Meteor.subscribe('get_res');






  Meteor.call("getData", function(err, result) {
  //  console.log('2',result);
        //Gives back an array with d1 in position 0 and d2 in position 1
  });
}


if (Meteor.isServer) {

  var Imap = Meteor.npmRequire('imap');
    var MailParser  = Meteor.npmRequire("mailparser").MailParser;
  console.log('imap_work');
  Meteor.startup(function () {
    // code to run on server at startup
  });

  var log = function(val,name){

    console.log('-------------'+name+'-------------');
    console.log(val);
    console.log('-------------/'+name+'/-------------');
  };


  var imap = new Imap({
    user: 'test@directseo.pl',
    password: 'sopocka21',
    host: 'mail.directseo.pl',
    port: 143
  });

  $arr_result =[];

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);


  }

  imap.once('ready', function() {
    get_boxes_email();
    openInbox(function(err, box) {
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
    });
  });

  imap.once('error', function(err) {
    console.log(err);
  });

  imap.once('end', function() {

 //   console.log('$arr_result:',$arr_result);

    console.log('Connection ended');
  });


  // return new/total/unseen message in box
  var get_boxes_email = function(){
    imap.getBoxes(function more(err, boxes, path) {
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


  imap.connect(function(err) {
    if (err) throw err;
    console.log('1');

  });


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

  Meteor.publish('get_res',function(){
    arr_result_combine($arr_result);
    for(var a=0; a<$arr_result.length; a++){
      this.added("get_res", a,$arr_result[a]);
    }


    this.ready();

  });




}

/* eslint-disable require-jsdoc */
$(function() {
  //peerIdが長いので100-999の乱数にする
  var peerId = String(Math.floor( Math.random() * 900 ) + 100); // 100から999の乱数を生成
  var mailler = $('#mailler');

  mailler.attr("href", "mailto:toaddress@domain.com?subject=call me&body=my peer id:" + peerId.toString())
  
  const url = "https://www.hiro-lab.site/hiroapp/skyway/sdk/examples/p2p-videochat/index.html";
  const br = "%0D%0A";

  // var textBody = "open this url:" + url + br + "Plese set this peer id and make a call :" + peerId.toString();


  // mailler.attr("href", "mailto:" + toaddress + "?subject=call me&body=" + textBody );
      
   // $('#mailler').on('click',function(e){
   //    // e.preventDefault();

   //    var toadd  = $('#toaddress').val();
   //    var domain = $('#domain').val();
   //    var toaddress = toadd.toString() + '@' + domain.toString();
   //    var textBody = "open this url:" + url + br + "Plese set this peer id and make a call :" + peerId.toString();


   //    mailler.attr("href", "mailto:" + toaddress + "?subject=call me&body=" + textBody );
      
   //    // location.href = "href", "mailto:" + toaddress + "?subject=call me&body=" + textBody
   //    //alert("test=>" + toaddress);


   // });

  // Peer object
  const peer = new Peer(peerId,
   {
    key:   window.__SKYWAY_KEY__,
    debug: 3,
  });

  let localStream;
  let existingCall;

  peer.on('open', () => {
    $('#my-id').text(peer.id);
    step1();
  });

  // Receiving a call
  peer.on('call', call => {
    // Answer the call automatically (instead of prompting user) for demo purposes
    call.answer(localStream);
    step3(call);
  });

  peer.on('error', err => {
    alert(err.message);
    // Return to step 2 if error occurs
    step2();
  });

  $('#make-call').on('submit', e => {
    e.preventDefault();
    // Initiate a call!
    console.log($('#callto-id').val());
    const call = peer.call($('#callto-id').val(), localStream);
    step3(call);
  });

  $('#end-call').on('click', () => {
    existingCall.close();
    step2();
  });

  // Retry if getUserMedia fails
  $('#step1-retry').on('click', () => {
    $('#step1-error').hide();
    step1();
  });

  // set up audio and video input selectors
  const audioSelect = $('#audioSource');
  const videoSelect = $('#videoSource');
  const selectors = [audioSelect, videoSelect];

  navigator.mediaDevices.enumerateDevices()
    .then(deviceInfos => {
      const values = selectors.map(select => select.val() || '');
      selectors.forEach(select => {
        const children = select.children(':first');
        while (children.length) {
          select.remove(children);
        }
      });

      for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = $('<option>').val(deviceInfo.deviceId);

        if (deviceInfo.kind === 'audioinput') {
          option.text(deviceInfo.label ||
            'Microphone ' + (audioSelect.children().length + 1));
          audioSelect.append(option);
        } else if (deviceInfo.kind === 'videoinput') {
        //  option.text(deviceInfo.label ||
        //    'Camera ' + (videoSelect.children().length + 1));
          // videoSelect.append(option);
        }
      }

    //iPHONEのディスプレイ側を初期血にする。
    for (let i = deviceInfos.length -1;  i >= 0 ; --i) {
        const deviceInfo2 = deviceInfos[i];
        const option2 = $('<option>').val(deviceInfo2.deviceId);
        if (deviceInfo2.kind === 'videoinput') {
          option2.text(deviceInfo2.label ||
            'Camera ' + (videoSelect.children().length + 1));
          videoSelect.append(option2);
        }
      }

     
      selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.children()).some(n => {
          return n.value === values[selectorIndex];
        })) {
          select.val(values[selectorIndex]);
        }
      });

      videoSelect.on('change', step1);
      audioSelect.on('change', step1);
    });

  function step1() {
    // Get audio/video stream
    const audioSource = $('#audioSource').val();
    const videoSource = $('#videoSource').val();
    const constraints = {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
      video: {deviceId: videoSource ? {exact: videoSource} : undefined},
    };

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      $('#my-video').get(0).srcObject = stream;
      localStream = stream;

      if (existingCall) {
        existingCall.replaceStream(stream);
        return;
      }

      step2();
    }).catch(err => {
      $('#step1-error').show();
      console.error(err);
    });
  }

  function step2() {
    $('#step1, #step3').hide();
    $('#step2').show();
    $('#callto-id').focus();
  }

  function step3(call) {
    // Hang up on an existing call if present
    if (existingCall) {
      existingCall.close();
    }
    // Wait for stream on the call, then set peer video display
    call.on('stream', stream => {
      const el = $('#their-video').get(0);
      el.srcObject = stream;
      el.play();
    });

    // UI stuff
    existingCall = call;
    $('#their-id').text(call.remoteId);
    call.on('close', step2);
    $('#step1, #step2').hide();
    $('#step3').show();
  }
});

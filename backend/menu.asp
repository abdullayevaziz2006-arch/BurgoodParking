<ul class="layui-nav layui-nav-tree" lay-filter="menu" lay-shrink="all" hik-menu>
  <!--本地-->
  <li class="layui-nav-item layui-nav-itemed" ng-show="!bIsDispatch">
    <a href="" module="local">
      <span class="menu-icon icon-home"></span>
      <span ng-bind="oMenuLan.local" show-title></span>
    </a>
  </li>
  <!--系统-->
  <li class="layui-nav-item">
    <a href="" module="system">
      <span class="menu-icon icon-system"></span>
      <span ng-bind="oMenuLan.system" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="setting">
          <span class="padding-left28" ng-bind="oMenuLan.systemSettings" show-title></span>
        </a>
      </dd>
      <dd
        ng-show="oNetwork.bSupportWifiProbe || oNetwork.bSupportCabinetParam || oNetwork.bSupportLocateSetting || oNetwork.bSupportMEFConfig || oNetwork.showNetScreens || oNetwork.bSupportNari || oNetwork.bSupportGasSense || oNetwork.showRs485Voice || oNetwork.showLCD || oNetwork.showLampSetting">
        <a href="" module="peripheral">
          <span class="padding-left28" ng-bind="oMenuLan.peripheralConfiguration" show-title></span>
        </a>
      </dd>
      <dd>
        <a href="" module="maintain">
          <span class="padding-left28" ng-bind="oMenuLan.maintenance" show-title></span>
        </a>
      </dd>
      <dd>
        <a href="" module="security">
          <span class="padding-left28" ng-bind="oMenuLan.security" show-title></span>
        </a>
      </dd>
      <dd>
        <a href="" module="powerManage" ng-show="bSupportPowerManage">
          <span class="padding-left28" ng-bind="oMenuLan.powerManagement" show-title></span>
        </a>
      </dd>
      <dd>
        <a href="" module="userManage">
          <span class="padding-left28" ng-bind="oMenuLan.userManagement" show-title></span>
        </a>
      </dd>
      <!-- 暂时保留以下 -->
      <dd ng-show="bSupportChannelManage">
        <a href="" module="channelManage">
          <span class="padding-left28" ng-bind="oMenuLan.cameraManagement" show-title></span>
        </a>
      </dd>
      <!-- <dd><a href="" module="user"><span ng-bind="oMenuLan.userManagement" show-title></span></a></dd> -->
      <!-- <dd ng-show="oCapbilities.bSupportDevMaintenance"><a href="" module="devMaintenance"><span ng-bind="oMenuLan.devMaintenance" show-title></span></a></dd> -->
    </dl>
  </li>
  <!--网络-->
  <li class="layui-nav-item">
    <a href="" module="network">
      <span class="menu-icon icon-network"></span>
      <span ng-bind="oMenuLan.network" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="networkConfig">
          <span class="padding-left28" ng-bind="oMenuLan.networkConfig" show-title></span>
        </a>
      </dd>
      <dd>
        <a href="" module="dataDocking">
          <span class="padding-left28" ng-bind="oMenuLan.dataDocking" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
  <!--音视频-->
  <!-- <li class="layui-nav-item">
    <a href="" module="videoAudio">
      <span class="menu-icon video-icon"></span>
      <span ng-bind="oMenuLan.videoOrAudio" show-title></span>
    </a>
  </li> -->
  <!--抓拍参数-->
  <li class="layui-nav-item">
    <a href="" module="snap">
      <span class="menu-icon icon-capture"></span>
      <span ng-bind="oMenuLan.aSnapParamAll" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd ng-show="!showTriggerModeForEntrance && !isSupportAddVehicleGroupInfo && !showEntranceParkingEN">
        <a href="" module="triggerMode">
          <span class="padding-left28" ng-bind="oMenuLan.aTriggerMode" show-title></span>
        </a>
      </dd>
      <!-- 出入口样式的应用模式 -->
      <dd ng-show="!showTriggerModeForEntrance && isSupportAddVehicleGroupInfo && !showEntranceParkingEN">
        <a href="" module="triggerModeForEntrance">
          <span class="padding-left28" ng-bind="oMenuLan.aTriggerMode" show-title></span>
        </a>
      </dd>
      <dd ng-show="showTrackSetting">
        <a href="" module="trackSetting">
          <span class="padding-left28" ng-bind="oMenuLan.trackSetting" show-title></span>
        </a>
      </dd>
      <!-- 出入口 -->
      <dd ng-show="showEntranceParking">
        <a href="" module="entrance">
          <span class="padding-left28" ng-bind="oMenuLan.entranceP" show-title></span>
        </a>
      </dd>

      <!-- 智能分析 -->
      <dd ng-show="showTriggerModeForEntrance && bSupportAlgbasic">
        <a href="" module="algbasic">
          <span class="padding-left28" ng-bind="oMenuLan.algbasic" show-title></span>
        </a>
      </dd>
      <dd
        ng-show="oSnapParam.bSupportSnapshot || oSnapParam.bSupportPlateRecognitionParam || oSnapParam.bSupportPlateRecognitionParam || oSnapParam.bSupportCarFeatureParam || oSnapParam.bSupportSyncSignalOutput || oSnapParam.bSupportOSDoverlay || false">
        <a href="" module="snapParam">
          <span class="padding-left28" ng-bind="oMenuLan.aSnapParam" show-title></span>
        </a>
      </dd>
      <dd ng-show="oImageParam.bSupportCapImage || oImageParam.bSupportIcr || false" id="ImageIcr">
        <a href="" module="snapImage">
          <span class="padding-left28" ng-bind="oMenuLan.aSnapImage" show-title></span>
        </a>
      </dd>
      <dd>
        <a href="" module="snapAdvance">
          <span class="padding-left28" ng-bind="oMenuLan.aSnapAdvanced" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
  <!--视频-->
  <li class="layui-nav-item">
    <a href="" module="video">
      <span class="menu-icon icon-video"></span>
      <span ng-bind="oMenuLan.video" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <!-- 卡警视频参数 -->
      <dd ng-show="!isSupportLicensePlateAssistRecognize">
        <a href="" module="videoParam">
          <span class="padding-left28" ng-bind="oMenuLan.videoParam" show-title></span>
        </a>
      </dd>
      <!-- 出入口视频参数 -->
      <dd ng-show="isSupportLicensePlateAssistRecognize">
        <a href="" module="videoParamForEntrance">
          <span class="padding-left28" ng-bind="oMenuLan.videoParam" show-title></span>
        </a>
      </dd>
      <dd ng-show="oVideoParam.bSupportITCPicOSD">
        <a href="" module="videoTextOverlay">
          <span class="padding-left28" ng-bind="oMenuLan.videoTextOverlay" show-title></span>
        </a>
      </dd>
      <dd>
        <a href="" module="videoCode">
          <span class="padding-left28" ng-bind="oMenuLan.videoCodecType" show-title></span>
        </a>
      </dd>
      <dd id="LightCorrectMo" ng-show="oImageParam.bSupportLightCorrect || oImageParam.bSupportChannelLightCorrect">
        <a href="" module="lightEnhance">
          <span class="padding-left28" ng-bind="oMenuLan.aLightEnhance" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
  <!--音频-->
  <li class="layui-nav-item" ng-show="oAudioParam.bSupportAudioSetting || oAudioParam.bSupportVoiceBroadcastInfo || oAudioParam.bSupportClusterIntercom">
    <a href="" module="audio">
      <span class="menu-icon icon-voice"></span>
      <span ng-bind="oMenuLan.laAudio" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd ng-show="oAudioParam.bSupportClusterIntercom">
        <a href="" module="advancedGroupTalk">
          <span class="padding-left28" ng-bind="oMenuLan.advancedGroupTalk" ng-show="!oAudioParam.groupTalkProtocol" show-title></span>
          <span class="padding-left28" ng-bind="oMenuLan.laGroupTalkChecked" ng-show="oAudioParam.groupTalkProtocol" show-title></span>
        </a>
      </dd>
      <dd ng-show="oAudioParam.bSupportAudioSetting">
        <a href="" module="audioSetting">
          <span class="padding-left28" ng-bind="oMenuLan.audioEncoding" show-title></span>
        </a>
      </dd>
      <dd ng-show="oAudioParam.bSupportVoiceBroadcastInfo">
        <a href="" module="voiceBroadcastStroage">
          <span class="padding-left28" ng-bind="oMenuLan.voiceBroadcast" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
  <!--机芯-->
  <!-- <li class="layui-nav-item" ng-show="bSupportMicrochip && (!bSupportPanoramaCamera || bSupportThreeChannelsDomeVertical)">
    <a href="" module="microchip">
      <span class="menu-icon icon-ptz"></span>
      <span ng-bind="oMenuLan.microchip" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="microchipParam">
          <span class="padding-left28" ng-bind="oMenuLan.microchipImg" show-title></span>
        </a>
      </dd>
    </dl>
  </li> -->
  <!--PTZ-->
  <li class="layui-nav-item" ng-show="bSupportPTZChannels">
    <a href="" module="ptz">
      <span class="menu-icon icon-ptz"></span>
      <span ng-bind="oMenuLan.ptzManagement" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="ptzCfg">
          <span class="padding-left28" ng-bind="oMenuLan.ptzManagement" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
  <!--存储-->
  <li class="layui-nav-item">
    <a href="" module="storage">
      <span class="menu-icon icon-storage"></span>
      <span ng-bind="oMenuLan.storage" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="storageManagement">
          <span class="padding-left28" ng-bind="oMenuLan.storageManagement" show-title></span>
        </a>
      </dd>
      <dd>
        <a href="" module="plan" ng-show="oStroage.bSupportMainAndSubRecord">
          <span class="padding-left28" ng-bind="oMenuLan.scheduleSettings" show-title></span>
        </a>
      </dd>
      <dd ng-show="false">
        <a href="" module="advanced">
          <span class="padding-left28" ng-bind="oMenuLan.advancedSettings" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
  <!--事件报警-->
  <li class="layui-nav-item" ng-show="bSupportEvent">
    <a href="" module="event">
      <span class="menu-icon icon-event"></span>
      <span ng-bind="oMenuLan.eventAlarm" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="exceptionEvent">
          <span class="padding-left28" ng-bind="oMenuLan.Exception" show-title></span>
        </a>
      </dd>
      <dd ng-show="oEvent.showVQDEvent">
        <a href="" module="VQDEvent">
          <span class="padding-left28" ng-bind="oMenuLan.VQDEvent" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
  <!--升级-->
  <li class="layui-nav-item layui-nav-itemed">
      <a href="" module="maintainUpgrade">
        <span class="menu-icon icon-upgrade"></span>
        <span ng-bind="oMenuLan.upgradeMaintain" show-title></span>
      </a>
  </li>
  <!--射频参数-->
  <li class="layui-nav-item" ng-show="showRFMode">
    <a href="" module="RFModule">
      <span class="menu-icon icon-system"></span>
      <span ng-bind="oMenuLan.RFModule"></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="RFModule">
          <span class="padding-left28" ng-bind="oMenuLan.RFModule"></span>
        </a>
      </dd>
    </dl>
  </li>
  <!--行人闯红灯-->
  <li class="layui-nav-item" ng-show="isSupportNonMotorNmvScreen">
    <a href="" module="pedLCD">
      <span class="menu-icon icon-system"></span>
      <span ng-bind="{true:oMenuLan.NonMotorNmvScreen, false:oMenuLan.pedLCD}[isSupportNonMotorNmvScreen]"></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="pedLCD">
          <span class="padding-left28"
            ng-bind="{true:oMenuLan.NonMotorNmvScreen, false:oMenuLan.pedLCD}[isSupportNonMotorNmvScreen]"></span>
        </a>
      </dd>
    </dl>
  </li>
  <!--开放平台-->
  <li class="layui-nav-item layui-nav-itemed" ng-show="showOpenPlatform">
    <a href="" module="openPlatformContent">
      <span class="menu-icon icon-system"></span>
      <span ng-bind="oMenuLan.openPlatformContent" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd ng-show="!disclaimerReady">
        <a href="" module="disclaimer">
          <span class="padding-left28" ng-bind="oMenuLan.disclaimer" show-title></span>
        </a>
      </dd>
      <dd ng-show="disclaimerReady">
        <a href="" module="openPlatform">
          <span class="padding-left28" ng-bind="oMenuLan.openPlatform" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
  <!-- 标定 -->
  <li class="layui-nav-item layui-nav-itemed" ng-show="bSupportOMasterSlaveCap">
    <a href="" module="masterSlaveCalibration">
      <span class="menu-icon icon-system"></span>
      <span ng-bind="oMenuLan.amasterSlaveCalibration" show-title></span>
    </a>
  </li>
  <!--扩展  自定义接口-->
  <li class="layui-nav-item layui-nav-itemed" ng-show="showTransparentChannel">
    <a href="" module="transparentChannel">
      <span class="menu-icon icon-system"></span>
      <span ng-bind="oMenuLan.transparentChannelCustom" show-title></span>
    </a>
  </li>
  <!--AI开放平台-->
  <li class="layui-nav-item" ng-show="isSupportAIOpenPlatform">
    <a href="" module="AIOpenplatform">
      <span class="menu-icon icon-system"></span>
      <span ng-bind="oMenuLan.aOpenPlatform" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="modelManage">
          <span class="padding-left28" ng-bind="oMenuLan.aModelManage" show-title></span>
        </a>
      </dd>
      <dd ng-show="isSupportPictureTask">
        <a href="" module="pictureTask">
          <span class="padding-left28" ng-bind="oMenuLan.aPictureTask" show-title></span>
        </a>
      </dd>
      <dd ng-show="isSupportVideoTask">
        <a href="" module="videoTask">
          <span class="padding-left28" ng-bind="oMenuLan.aVideoTask" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
  <!-- 热成像 -->
  <li class="layui-nav-item" ng-show="bSupportVehicleThermometry">
    <a href="" module="thermal">
      <span class="menu-icon icon-thermal"></span>
      <span ng-bind="oMenuLan.laThermalSettings" show-title></span>
    </a>
    <dl class="layui-nav-child">
      <dd>
        <a href="" module="thermalManagement">
          <span class="padding-left28" ng-bind="oMenuLan.laThermalManagement" show-title></span>
        </a>
      </dd>
      <dd>
        <a href="" module="thermalMode">
          <span class="padding-left28" ng-bind="oMenuLan.aTriggerMode" show-title></span>
        </a>
      </dd>
    </dl>
  </li>
</ul>
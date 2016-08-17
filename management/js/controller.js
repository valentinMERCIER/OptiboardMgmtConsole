var PulseServer = angular.module('app', ['ng.jsoneditor']);

var urlCommon = "./";

PulseServer.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

PulseServer.controller('ManagementController', function($scope, $http,$interval) {

	
	$scope.version='0.0.1';
	$scope.polls=0;
	$scope.config={};

	$scope.screenTypes=["URL","Free Html","Table"];

	
	var stop = $interval(function() {
				PulseServer.refreshStatus();
				$scope.polls++;
	        }, 2000);

	/***** TABLE CONFIG *****/
	
	
	$scope.addSubTableFrame=function()
	{
		$scope.curTableConfig.entries.push({image:'1',room:'Edison',description:'My Stuff',scheduleStart:'08:30',scheduleEnd:'08:30'});

	}

	$scope.showTableConfig=function(subframe)
	{
		$scope.tableSubFrame=subframe;
		if($scope.tableSubFrame.table==null)
		{
			$scope.curTableConfig={};
			$scope.curTableConfig.entries=[];			
		}
		else
			$scope.curTableConfig=$scope.tableSubFrame.table;
		$scope.tableConfigShown=true;	

	}

	$scope.closeTableConfig=function()
	{
		$scope.tableConfigShown=false;	
					
	}
	
	$scope.saveTableConfig=function()
	{
		$scope.tableConfigShown=false;
		$scope.tableSubFrame.table=$scope.curTableConfig;
	}
	
	$scope.removeSubTableFrame=function(entry)
	{
		entry.mustBeRemoved=true;
		
		for(var i=$scope.curTableConfig.entries.length-1;i>=0;i--)
		{
			if($scope.curTableConfig.entries[i].mustBeRemoved)
			{
				$scope.curTableConfig.entries.splice(i,1);
			}
		}
	}
	
	$scope.moveSubTableFrameUp=function(entry)
	{
		entry.mustBeRemoved=true;		
		
		for(var i=$scope.curTableConfig.entries.length-1;i>=0;i--)
		{
			if($scope.curTableConfig.entries[i].mustBeRemoved)
			{
				entry.mustBeRemoved=false;
				$scope.curTableConfig.entries.splice(i,1);
				$scope.curTableConfig.entries.splice(i-1,0,entry);
				break;
			}
		}
		
	}
	
	$scope.moveSubTableFrameDown=function(entry)
	{
		entry.mustBeRemoved=true;
		
		for(var i=$scope.curTableConfig.entries.length-1;i>=0;i--)
		{
			if($scope.curTableConfig.entries[i].mustBeRemoved)
			{
				entry.mustBeRemoved=false;
				
				$scope.curTableConfig.entries.splice(i,1);
				$scope.curTableConfig.entries.splice(i+1,0,entry);
				break;
			}
		}
	}
	
	

	/***** CONFIG *****/

	$scope.showConfig=function()
	{
		$scope.configShown=true;
		$scope.oldconfig=JSON.parse(JSON.stringify($scope.config));
	}

	$scope.closeConfig=function()
	{
		$scope.configShown=false;
		$scope.tableConfigShown=false;				
		$scope.config=$scope.oldconfig;
		if($scope.config.screens.length>0)
		{
			$scope.selectedScreen=$scope.config.screens[0];
		}
	}

	$scope.saveConfig=function()
	{
		$scope.configShown=false;
		$scope.updateConfig();
	}

	$scope.addScreen=function()
	{
		$scope.config.screens.push({"name":"Screen"+($scope.config.screens.length),"subFrames":[]});
		$scope.selectedScreen=$scope.config.screens[$scope.config.screens.length-1];
	}
	
	
	$scope.showKibana=function()
	{
		$scope.kibanaShown=true;
	}

	$scope.closeKibana=function()
	{
		$scope.kibanaShown=false;
	}

/*********************************************************************/
	
	$scope.moveSubFrameUp=function(subframe)
	{
		subframe.mustBeRemoved=true;		
		
		for(var i=$scope.selectedScreen.subFrames.length-1;i>=0;i--)
		{
			if($scope.selectedScreen.subFrames[i].mustBeRemoved)
			{
				subframe.mustBeRemoved=false;
				$scope.selectedScreen.subFrames.splice(i,1);
				$scope.selectedScreen.subFrames.splice(i-1,0,subframe);
				break;
			}
		}
		
	}
	
	$scope.moveSubFrameDown=function(subframe)
	{
		subframe.mustBeRemoved=true;
		
		for(var i=$scope.selectedScreen.subFrames.length-1;i>=0;i--)
		{
			if($scope.selectedScreen.subFrames[i].mustBeRemoved)
			{
				subframe.mustBeRemoved=false;
				
				$scope.selectedScreen.subFrames.splice(i,1);
				$scope.selectedScreen.subFrames.splice(i+1,0,subframe);
				break;
			}
		}
	}
	
	$scope.addSubFrame=function()
	{
		if($scope.selectedScreen.subFrames==undefined)
			$scope.selectedScreen.subFrames=[];
			
		$scope.selectedScreen.subFrames.push({"name":"Name"+($scope.selectedScreen.subFrames.length+1)});
	}
	


	$scope.removeSubFrame=function(subframe)
	{
		subframe.mustBeRemoved=true;
		
		for(var i=$scope.selectedScreen.subFrames.length-1;i>=0;i--)
		{
			if($scope.selectedScreen.subFrames[i].mustBeRemoved)
			{
				$scope.selectedScreen.subFrames.splice(i,1);
			}
		}
	}

/*********************************************************************/

	$scope.deleteScreen=function()
	{	
		$scope.selectedScreen.mustBeDeleted=true;
		for(var i=$scope.config.screens.length-1;i>=0;i--)
		{
			if($scope.config.screens[i].mustBeDeleted)
				$scope.config.screens.splice(i,1);
		}
		if($scope.config.screens.length>0)
		{
			$scope.selectedScreen=$scope.config.screens[$scope.config.screens.length-1];
		}
	}
	
	PulseServer.refreshStatus = function()
	{
		if($scope.suspended)
			return;
		$http({
		  method: 'GET',
		  url: urlCommon+'status'
		}).then(function successCallback(response) {
			 $scope.status=response.data;
			 $scope.status.columns=null;
			 $scope.columns=response.data.decoderColumns;


			
		  }, function errorCallback(response) {
			  $scope.status="Error while loading status.";
		});
	}
	
	function init() {
		$http.get("getClients")
			.success(function (response){
			$scope.clients = response.clients;
			$scope.selectedClient = $scope.clients[0];
			
			
			$http.get("getConfig?clientID="+$scope.selectedClient.id)
				.success(function (response) {
					$scope.config = response;
					
					if($scope.config.screens.length>0)
					{
						$scope.selectedScreen=$scope.config.screens[0];
					}
			});
		});	
		
	}
	init();
	
	$scope.clickClient = function(client){
		$scope.selectedClient = client;
		
		$http.get("getConfig?clientID="+$scope.selectedClient.id)
			.success(function (response) {
				$scope.config = response;
				
				console.log('$scope.config')
				console.log($scope.config)
				
				if($scope.config.screens.length>0)
				{				
					$scope.selectedScreen=$scope.config.screens[0];
				}
		});
	}
	
	$scope.clickAllScreenSelector = function(){
		console.log($scope.config.allScreenSelector);
		
		for(var i in $scope.config.screens)
		{
			$scope.config.screens[i].selected = $scope.config.allScreenSelector;
		}
		
	}
	
	$scope.uploadZip = function(){
		var file = $scope.myFile;
        var uploadUrl = "./fileUpload";
        var fd = new FormData();
		var selectedScreens=[];
		
		for(var i=0;i<$scope.config.screens.length;i++)
		{
			if($scope.config.screens[i].selected)
				selectedScreens.push($scope.config.screens[i].name);
			
		}
		
        fd.append('file', file);
		fd.append('target',JSON.stringify(selectedScreens));
		fd.append('client',JSON.stringify($scope.selectedClient));

        $http.post(uploadUrl,fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .success(function(){
			alert('Zip sent !!!');
          console.log("success!!");
        })
        .error(function(){
			alert('Unable to send zip !!!');
          console.log("error!!");
        });
	    };
	
	$scope.updateConfig = function(){
		
		var configToBeSaved = JSON.parse(JSON.stringify($scope.config));
	
		for(var i in configToBeSaved.screens)
		{
			configToBeSaved.screens[i].selected = false
		}
	
		console.log('updating config')
	
		$http.post("updateConfig", {"client":$scope.selectedClient,"config":configToBeSaved})
			.success(function (response) {
				alert("Config saved!");
		});
	}
	
	$scope.selectedScreens = function() {
		for(var i in $scope.config.screens)
		{
			if($scope.config.screens[i].selected)
			{
				return true;
			}
		}
		return false;
	}
	
});
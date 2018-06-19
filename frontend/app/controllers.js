'use strict';

angular.module('acServerManager')

	// Server status controller
	.controller('StatusCtrl', function($scope, $state, $timeout, ProcessService, ServerService) {
		$state.current.data.alerts = [];
		$scope.logdata = "";

		(function getACServerStatus() {
			ProcessService.ACServerStatus($scope.logdata.length, function(data){
				$scope.acServerStatus = data.status;
				$scope.serverIp = data.ip;
				$scope.logdata += data.log;
				$scope.pid = data.pid;

				// scroll pre to bottom if it's within about ~50-75px of the bottom already
				// todo: re-implement in a non-hacky way
				var $pre = $('pre');
				if($pre.length && data.log.length > 0 && $pre.height() + $pre.scrollTop() > $pre[0].scrollHeight - 100) {
					setTimeout(function() {
						$pre.scrollTop($pre[0].scrollHeight);
					}, 10);
				}
				$timeout(getACServerStatus, 2000);
			});
		})();

		(function getSTrackerServerStatus() {
			ProcessService.STrackerServerStatus(function(data){
				$scope.sTrackerServerStatus = data.status;
				$timeout(getSTrackerServerStatus, 2000);
			});
		})();

		(function getServerStatus() {
			ServerService.GetServerStatus(function(data){
				$scope.serverStatus = data;
				$timeout(getServerStatus, 2000);
			});
		})();

		$scope.startACServer = function() {
			ProcessService.StartACServer(function(result) {
				if (!(result[0] === 'O' && result[1] === 'K')) {
					createAlert('warning', 'Failed to start AC server', true)
				}
			})
		}

		$scope.stopACServer = function() {
			$scope.stopSTrackerServer();
			ProcessService.StopACServer(function(result) {
				$scope.acServerStatus = 0;
				$scope.logdata = "";
				$scope.pid = 0;
				if (!(result[0] === 'O' && result[1] === 'K')) {
					createAlert('warning', 'Failed to stop AC server', true)
				}
			})
		}

		$scope.restartACServer = function() {
			ProcessService.RestartACServer(function(result) {
				$scope.acServerStatus = 0;
				$scope.logdata = "";
				$scope.pid = 0;
				if (!(result[0] === 'O' && result[1] === 'K')) {
					createAlert('warning', 'Failed to restart AC server', true)
				}
			})
		}

		$scope.startSTrackerServer = function() {
			ProcessService.StartSTrackerServer(function(result) {
				if (!(result[0] === 'O' && result[1] === 'K')) {
					createAlert('warning', 'Failed to start stracker', true)
				}
			})
		}

		$scope.stopSTrackerServer = function() {
			ProcessService.StopSTrackerServer(function(result) {
				if (!(result[0] === 'O' && result[1] === 'K')) {
					createAlert('warning', 'Failed to stop stracker', true)
				}
			})
		}

		$scope.restartSTrackerServer = function() {
			ProcessService.RestartSTrackerServer(function(result) {
				if (!(result[0] === 'O' && result[1] === 'K')) {
					createAlert('warning', 'Failed to restart stracker', true)
				}
			})
		}

		$scope.closeAlert = function(index) {
			$state.current.data.alerts.splice(index, 1);
		};

		function createAlert(type, msg, autoClose) {
			var alert = { type: type, msg: msg};
			$state.current.data.alerts.push(alert);
			if (autoClose) {
				$timeout(function(){
					$state.current.data.alerts.splice($state.current.data.alerts.indexOf(alert), 1);
				}, 3000);
			}
		}
	})

	// Self-hosted plugin page
	.controller('pluginCtrl', function($scope, $stateParams, $sce, ProcessService) {

		console.log($stateParams.name);

		//todo: CORS?
		var serverIp = '',
				// todo: scan stracker/stracker.ini for listen_port:
				//[HTTP_CONFIG]
				//enabled = True
				//listen_port = 50041
				pluginPort = '50041';

		$scope.url = $sce.trustAsResourceUrl('');

		ProcessService.ACServerStatus(function(data) {
			serverIp = data.ip;

			// window.location.href = '//' + serverIp + ':' + pluginPort;
			$scope.url = $sce.trustAsResourceUrl('//' + serverIp + ':' + pluginPort);
		});
	})

	// Server config controller
	.controller('ConfigCtrl', function ($scope, $state, $filter, $timeout, distanceFilter, CarService, TrackService, ServerService, BookService, PracticeService, QualifyService, RaceService, TyreService, WeatherService, DynamicTrackService) {
		$scope.sessions = [];
		$state.current.data.alerts = [];
		$scope.weather = [];
		var newWeather = {
			GRAPHICS: '3_clear',
			BASE_TEMPERATURE_AMBIENT: '20',
			BASE_TEMPERATURE_ROAD: '7',
			VARIATION_AMBIENT: '2',
			VARIATION_ROAD: '2'
		};

		$scope.dynamicTrackPreset = -1;
		$scope.dynamicTrackPresets = [
			{
				LAP_GAIN: 30,
				RANDOMNESS: 1,
				SESSION_START: 86,
				SESSION_TRANSFER: 50
			},
			{
				LAP_GAIN: 50,
				RANDOMNESS: 3,
				SESSION_START: 89,
				SESSION_TRANSFER: 80
			},
			{
				LAP_GAIN: 300,
				RANDOMNESS: 1,
				SESSION_START: 96,
				SESSION_TRANSFER: 80
			},
			{
				LAP_GAIN: 132,
				RANDOMNESS: 2,
				SESSION_START: 95,
				SESSION_TRANSFER: 90
			},
			{
				LAP_GAIN: 700,
				RANDOMNESS: 2,
				SESSION_START: 98,
				SESSION_TRANSFER: 80
			},
			{
				LAP_GAIN: 1,
				RANDOMNESS: 0,
				SESSION_START: 100,
				SESSION_TRANSFER: 100
			},
		];


		$scope.dynamicTrackPresetChanged = function(data) {
			// user selected 'custom' (nothing to do)
			if(this.dynamicTrackPreset == -1) {
				return;
			}

			// check selected preset against array
			$scope.dynamicTrack = this.dynamicTrackPresets[this.dynamicTrackPreset];
		};



		$scope.assistOptions = [
			{
				value: '0',
				name: 'Force Off'
			},
			{
				value: '1',
				name: 'Factory'
			},
			{
				value: '2',
				name: 'Force On'
			}
		];


		BookService.GetBookingDetails(function (data) {
			data.ENABLED = (data.NAME !== void 0);
			data.TIME = parseInt(data.TIME);

			$scope.booking = data;
		});
		PracticeService.GetPracticeDetails(function (data) {
			data.ENABLED = (data.NAME !== void 0);
			data.TIME = parseInt(data.TIME);
			data.IS_OPEN = data.IS_OPEN == "1";

			$scope.practice = data;
		});

		QualifyService.GetQualifyDetails(function (data) {
			data.ENABLED = (data.NAME !== void 0);
			data.TIME = parseInt(data.TIME);
			data.IS_OPEN = data.IS_OPEN == "1";
			data.QUALIFY_MAX_WAIT_PERC = parseInt(data.QUALIFY_MAX_WAIT_PERC);

			$scope.qualify = data;
		});

		RaceService.GetRaceDetails(function (data) {
			data.ENABLED = (data.NAME !== void 0);
			data.LAPS = parseInt(data.LAPS);
			data.WAIT_TIME = parseInt(data.WAIT_TIME);
			data.TIME = parseInt(data.TIME);

			$scope.race = data;
		});

		CarService.GetCars(function (data) {
			$scope.cars = data;
		});



		DynamicTrackService.GetDynamicTrackDetails(function (data) {
			$scope.dynamicTrackEnabled = data.LAP_GAIN !== undefined;

			data.LAP_GAIN = parseInt(data.LAP_GAIN);
			data.RANDOMNESS = parseInt(data.RANDOMNESS);
			data.SESSION_START = parseInt(data.SESSION_START);
			data.SESSION_TRANSFER = parseInt(data.SESSION_TRANSFER);

			$scope.dynamicTrack = data;


			if(!$scope.dynamicTrackEnabled) {
				return;
			}

			var found = -1;

			for(var i=0; i < $scope.dynamicTrackPresets.length; i++) {
				var item = $scope.dynamicTrackPresets[i];
				if(item.LAP_GAIN == data.LAP_GAIN &&
					item.RANDOMNESS == data.RANDOMNESS &&
					item.SESSION_START == data.SESSION_START &&
					item.SESSION_TRANSFER == data.SESSION_TRANSFER) {
						found = i;
						break;
				}
			}

			if($scope.dynamicTrackPreset != found) {
				$scope.dynamicTrackPreset = found;
			}
		});

		ServerService.GetServerDetails(function (data) {

			data.DAMAGE_MULTIPLIER = parseInt(data.DAMAGE_MULTIPLIER);
			data.TYRE_WEAR_RATE = parseInt(data.TYRE_WEAR_RATE);
			data.FUEL_RATE = parseInt(data.FUEL_RATE);
			data.MAX_BALLAST_KG = parseInt(data.MAX_BALLAST_KG);

			data.RACE_OVER_TIME = parseInt(data.RACE_OVER_TIME);
			data.REVERSED_GRID_RACE_POSITIONS = parseInt(data.REVERSED_GRID_RACE_POSITIONS);
			data.RACE_PIT_WINDOW_START = parseInt(data.RACE_PIT_WINDOW_START);
			data.RACE_PIT_WINDOW_END = parseInt(data.RACE_PIT_WINDOW_END);

			data.MAX_CLIENTS = parseInt(data.MAX_CLIENTS);
			data.RESULT_SCREEN_TIME = parseInt(data.RESULT_SCREEN_TIME);
			data.VOTING_QUORUM = parseInt(data.VOTING_QUORUM);
			data.VOTE_DURATION = parseInt(data.VOTE_DURATION);
			data.KICK_QUORUM = parseInt(data.KICK_QUORUM);
			data.MAX_CONTACTS_PER_KM = parseInt(data.MAX_CONTACTS_PER_KM);
			data.UDP_PORT = parseInt(data.UDP_PORT);
			data.TCP_PORT = parseInt(data.TCP_PORT);
			data.HTTP_PORT = parseInt(data.HTTP_PORT);
			data.CLIENT_SEND_INTERVAL_HZ = parseInt(data.CLIENT_SEND_INTERVAL_HZ);
			data.UDP_PLUGIN_LOCAL_PORT = parseInt(data.UDP_PLUGIN_LOCAL_PORT);
			data.AUTH_PLUGIN_ADDRESS = parseInt(data.AUTH_PLUGIN_ADDRESS);

			$scope.server = data;

			try {
				$scope.selectedTracks = data.TRACK;

				data.LOOP_MODE = data.LOOP_MODE == 1;
				data.LOCKED_ENTRY_LIST = data.LOCKED_ENTRY_LIST == 1;
				data.PICKUP_MODE_ENABLED = data.PICKUP_MODE_ENABLED == 1;
				data.REGISTER_TO_LOBBY = data.REGISTER_TO_LOBBY == 1;

				data.AUTOCLUTCH_ALLOWED = data.AUTOCLUTCH_ALLOWED == 1;
				data.STABILITY_ALLOWED = data.STABILITY_ALLOWED == 1;
				data.TYRE_BLANKETS_ALLOWED = data.TYRE_BLANKETS_ALLOWED == 1;
				data.FORCE_VIRTUAL_MIRROR = data.FORCE_VIRTUAL_MIRROR == 1;

				if(data.SUN_ANGLE > 0){
					var time = getTime(data.SUN_ANGLE);
					$scope.hours = time.getHours();
					$scope.mins = time.getMinutes();
				}
			} catch (e) {
				console.log('Error - ' + e);
			}

			TrackService.GetTracks(function (data) {
				$scope.tracks = data;
				$scope.trackChanged();
			});
		});

		WeatherService.GetWeather(function (data) {
			data = data[0];
			data.BASE_TEMPERATURE_AMBIENT = parseInt(data.BASE_TEMPERATURE_AMBIENT);
			data.VARIATION_AMBIENT = parseInt(data.VARIATION_AMBIENT);
			data.BASE_TEMPERATURE_ROAD = parseInt(data.BASE_TEMPERATURE_ROAD);
			data.VARIATION_ROAD = parseInt(data.VARIATION_ROAD);

			data.WIND_BASE_SPEED_MIN = parseInt(data.WIND_BASE_SPEED_MIN);
			data.WIND_BASE_SPEED_MAX = parseInt(data.WIND_BASE_SPEED_MAX);
			data.WIND_BASE_DIRECTION = parseInt(data.WIND_BASE_DIRECTION);
			data.WIND_VARIATION_DIRECTION = parseInt(data.WIND_VARIATION_DIRECTION);

			$scope.weather = data;
		});



		$scope.trackChanged = function() {
			var track = findInArray($scope.tracks, {name: $scope.selectedTracks})
			if (track !== null) {
				if (track.configs && track.configs.length) {
					$scope.configs = track.configs;
					$scope.server.CONFIG_TRACK = $scope.configs[0];

					TrackService.GetTrackDetails(track.name, $scope.server.CONFIG_TRACK, function(data) {
						$scope.trackDetails = data;
					});

					$scope.trackImage = '/api/tracks/' + $scope.selectedTracks + '/' + $scope.server.CONFIG_TRACK + '/image';
					$scope.trackOutline = '/api/tracks/' + $scope.selectedTracks + '/' + $scope.server.CONFIG_TRACK + '/outline';
				} else {
					$scope.configs = null;
					$scope.server.CONFIG_TRACK = '';

					TrackService.GetTrackDetails(track.name, null, function(data) {
						$scope.trackDetails = data;
					});

					$scope.trackImage = '/api/tracks/' + $scope.selectedTracks + '/image';
					$scope.trackOutline = '/api/tracks/' + $scope.selectedTracks + '/outline';
				}
			}
		};

		$scope.submit = function() {
			$scope.$broadcast('show-errors-check-validity');

			if ($scope.form.$invalid) {
				createAlert('warning', 'There are errors on the form', true);
				return;
			}

			try {

				var isValidNum = function(input) {
					return !isNaN(parseInt(input));
				}

				var data = angular.copy($scope.server);

				data.LOCKED_ENTRY_LIST = $scope.server.LOCKED_ENTRY_LIST ? 1 : 0;
				data.LOOP_MODE = $scope.server.LOOP_MODE ? 1 : 0;
				data.PICKUP_MODE_ENABLED = $scope.server.PICKUP_MODE_ENABLED ? 1 : 0;
				data.REGISTER_TO_LOBBY = $scope.server.REGISTER_TO_LOBBY ? 1 : 0;
				data.TRACK = $scope.selectedTracks;
				data.SUN_ANGLE = getSunAngle($scope.hours, $scope.mins);

				data.AUTOCLUTCH_ALLOWED = $scope.server.AUTOCLUTCH_ALLOWED ? 1 : 0;
				data.STABILITY_ALLOWED = $scope.server.STABILITY_ALLOWED ? 1 : 0;
				data.TYRE_BLANKETS_ALLOWED = $scope.server.TYRE_BLANKETS_ALLOWED ? 1 : 0;
				data.FORCE_VIRTUAL_MIRROR = $scope.server.FORCE_VIRTUAL_MIRROR ? 1 : 0;


				if($scope.server.RACE_GAS_PENALTY_DISABLED != undefined) {
					data.RACE_GAS_PENALTY_DISABLED = $scope.server.RACE_GAS_PENALTY_DISABLED ? 1 : 0;
				}

				if(!isValidNum(data.MAX_BALLAST_KG)) {
					delete data.MAX_BALLAST_KG;
				}
				if(!isValidNum(data.RACE_OVER_TIME)) {
					delete data.RACE_OVER_TIME;
				}
				if(!isValidNum(data.REVERSED_GRID_RACE_POSITIONS)) {
					delete data.REVERSED_GRID_RACE_POSITIONS;
				}
				if(!isValidNum(data.RACE_PIT_WINDOW_START)) {
					delete data.RACE_PIT_WINDOW_START;
				}
				if(!isValidNum(data.RACE_PIT_WINDOW_END)) {
					delete data.RACE_PIT_WINDOW_END;
				}
				if(!isValidNum(data.AUTH_PLUGIN_ADDRESS)) {
					delete data.AUTH_PLUGIN_ADDRESS;
				}
				if(!isValidNum(data.RESULT_SCREEN_TIME)) {
					delete data.RESULT_SCREEN_TIME;
				}
				if(!isValidNum(data.MAX_CONTACTS_PER_KM)) {
					delete data.MAX_CONTACTS_PER_KM;
				}

				if(!$scope.dynamicTrackEnabled) {
					$scope.dynamicTrack = {};
				}

				if (!$scope.server.UDP_PLUGIN_LOCAL_PORT) {
					$scope.server.UDP_PLUGIN_LOCAL_PORT = '';
				}

				var saved = true;

				ServerService.SaveServerDetails(data, function(result) {
					if (!(result[0] === 'O' && result[1] === 'K')) {
						saved = false;
					}
				});

				DynamicTrackService.SaveDynamicTrackDetails($scope.dynamicTrack, function(result) {
					if (!(result[0] === 'O' && result[1] === 'K')) {
						saved = false;
					}
				});


				var booking = angular.copy($scope.booking);
				if(!booking.ENABLED) {
					booking = {};
				}
				else {
					booking.NAME = "Booking";
				}
				delete booking.ENABLED;
				BookService.SaveBookingDetails(booking, function(result) {
					if (!(result[0] === 'O' && result[1] === 'K')) {
						saved = false;
					}
				});

				var practice = angular.copy($scope.practice);
				if(!practice.ENABLED) {
					practice = {};
				} else {
					practice.IS_OPEN = practice.IS_OPEN ? 1 : 0;
					practice.NAME = "Practice";
				}
				delete practice.ENABLED;
				PracticeService.SavePracticeDetails(practice, function(result) {
					if (!(result[0] === 'O' && result[1] === 'K')) {
						saved = false;
					}
				});

				var qualify = angular.copy($scope.qualify);
				if(!qualify.ENABLED) {
					qualify = {};
				} else {
					qualify.IS_OPEN = qualify.IS_OPEN ? 1 : 0;
					qualify.NAME = "Qualify";

					if(!isValidNum(qualify.QUALIFY_MAX_WAIT_PERC)) {
						delete qualify.QUALIFY_MAX_WAIT_PERC;
					}
				}
				delete qualify.ENABLED;
				QualifyService.SaveQualifyDetails(qualify, function(result) {
					if (!(result[0] === 'O' && result[1] === 'K')) {
						saved = false;
					}
				});

				var race = angular.copy($scope.race);
				if(!race.ENABLED) {
					race = {};
				}
				else {
					race.NAME = "Race";

					if(!isValidNum(race.LAPS)) {
						delete race.LAPS;
					}
					if(!isValidNum(race.WAIT_TIME)) {
						delete race.WAIT_TIME;
					}
					if(!isValidNum(race.TIME)) {
						delete race.TIME;
					}

				}
				delete race.ENABLED;
				RaceService.SaveRaceDetails(race, function(result) {
					if (!(result[0] === 'O' && result[1] === 'K')) {
						saved = false;
					}
				});


				var weather = angular.copy($scope.weather);
				if(!isValidNum(weather.WIND_BASE_SPEED_MIN)) {
					delete weather.WIND_BASE_SPEED_MIN;
				}

				if(!isValidNum(weather.WIND_BASE_SPEED_MAX)) {
					delete weather.WIND_BASE_SPEED_MAX;
				}

				if(!isValidNum(weather.WIND_BASE_DIRECTION)) {
					delete weather.WIND_BASE_DIRECTION;
				}

				if(!isValidNum(weather.WIND_VARIATION_DIRECTION)) {
					delete weather.WIND_VARIATION_DIRECTION;
				}

				WeatherService.SaveWeather([weather], function(result) {
					if (!(result[0] === 'O' && result[1] === 'K')) {
						saved = false;
					}
				});

				if (saved) {
					createAlert('success', 'Saved successfully', true);
				} else {
					createAlert('warning', 'Save failed', true);
				}
			} catch (e) {
				console.log('Error - ' + e);
			}
		}

		$scope.closeAlert = function(index) {
			$state.current.data.alerts.splice(index, 1);
		};

		function getTime(sunAngle) {
			var baseLine = new Date(2000, 1, 1, 13, 0, 0, 0);
			var offset = sunAngle / 16;
			var multiplier = offset * 60;
			baseLine.setMinutes(baseLine.getMinutes() + multiplier);
			return baseLine;
		}

		function getSunAngle(hours, mins) {
			var baseLine = new Date(2000, 1, 1, 13, 0, 0, 0);
			var time = new Date(2000, 1, 1, hours, mins, 0);
			var diff = time - baseLine;
			var minDiff = Math.round(diff / 60000);
			var multiplier = minDiff / 60;
			var sunAngle = multiplier * 16;
			return sunAngle;
		}

		function createAlert(type, msg, autoClose) {
			var alert = { type: type, msg: msg};
			$state.current.data.alerts.push(alert);
			if (autoClose) {
				$timeout(function(){
					$state.current.data.alerts.splice($state.current.data.alerts.indexOf(alert), 1);
				}, 3000);
			}
		}

		function findInArray(arr, search) {
			var found = $filter('filter')(arr, search, true);
			if (found.length) {
				return found[0];
			}

			return null;
		}
	})

	// Cat List temp controller
	.controller('EntryListCtrl', function($scope, $state, $timeout, $filter, ServerService, CarService, EntryListService, DriverService, TyreService) {
		$state.current.data.alerts = [];
		$scope.entryList = [];
		$scope.drivers =[];
		$scope.amount = 1;
		$scope.random = false;
		$scope.newEntry = {
			DRIVERNAME: '',
			TEAM: '',
			MODEL: '',
			SKIN: '',
			GUID: '',
			SPECTATOR_MODE: '',
			BALLAST: 0
		};

			function findInArray(arr, search) {
				var found = $filter('filter')(arr, search, true);
				if (found.length) {
					return found[0];
				}

				return null;
			}
		$scope.$watchCollection('newEntry', function (newVal, oldVal) {
			$scope.disableAmount = newVal.DRIVERNAME || newVal.TEAM || newVal.GUID
			if ($scope.disableAmount) {
				$scope.amount = 1;
			}
		});

		ServerService.GetServerDetail('cars', function (data) {
			try {
				$scope.cars = data.value.split(';');
				$scope.newEntry.MODEL = $scope.cars[0];
				$scope.selectedCarChanged();

			} catch (e) {
				console.log('Error - ' + e);
			}
		});

		ServerService.GetServerDetails(function (data) {

			$scope.selectedCars = data.CARS.split(';');
			$scope.selectedTyres = data.LEGAL_TYRES.split(';');

			$scope.carsChanged();

		});

		EntryListService.GetEntryList(function (data) {
			angular.forEach(data, function(value, key) {
				if (key.indexOf('CAR_') === 0) {
					value.SPECTATOR_MODE = value.SPECTATOR_MODE == 1;
					$scope.entryList.push(value);
				}
			});
		});

		CarService.GetCars(function (data) {
			$scope.cars = data;
		});




		DriverService.GetDrivers(function (data) {
			$scope.drivers = data;
		});


		$scope.tyresChanged = function() {
			//If there are no selected tyres in cfg, this is the same as having all available
			if ($scope.selectedTyres.length === 0) {
				angular.forEach($scope.tyres, function(value, key) {
					$scope.selectedTyres.push(value.value);
				});
			}
		}

		$scope.carsChanged = function() {
			if ($scope.selectedCars && $scope.selectedCars.length == 0) {
				$scope.tyres = [];
				return;
			}

			try {
				TyreService.GetTyres($scope.selectedCars.join(','), function(result) {
					//Restructure the object to something that is nicer to format
					var tyreTypes = {};
					angular.forEach(result, function(value, key) {
						if (key !== '$promise' ) {
							var car = key;
							angular.forEach(value, function(value, key) {
								if (!tyreTypes[key]) {
									tyreTypes[key] = [];
								}

								var desc = findInArray(tyreTypes[key], { desc: value });
								if (desc == null) {
									desc = { desc: value };
									desc.cars = [];
									tyreTypes[key].push(desc);
								}

								desc.cars.push(car);

							});
						}
					});

					//Use the new format to create a flat object array for binding
					$scope.tyres = [];
					angular.forEach(tyreTypes, function(typeValue, typeKey) {
						var tyre = { value: typeKey };
						var description = typeKey + ':';
						angular.forEach(typeValue, function(descValue, descKey) {
							description += descValue.desc + ' (';
							angular.forEach(descValue.cars, function(carValue, carKey) {
								description += carValue + ',';
							});
							description = description.substring(0, description.length - 1) + ') ';
						});
						tyre.description = description.trim();
						$scope.tyres.push(tyre);
					});

					//Remove any selected tyres that are no longer available after a car change
					$scope.selectedTyres = $scope.selectedTyres.filter(function(element) {
						var found = findInArray($scope.tyres, { value: element });
						return found !== null;
					});

					//If there are no selected tyres in cfg, this is the same as having all available
					if ($scope.selectedTyres.length === 0) {
						angular.forEach($scope.tyres, function(value, key) {
							$scope.selectedTyres.push(value.value);
						});
					}
				});
			} catch (e) {
				console.log('Error - ' + e);
			}
		}

		$scope.selectedCarChanged = function() {
			CarService.GetSkins($scope.newEntry.MODEL, function(data) {
				$scope.skins = data.skins;
				$scope.newEntry.SKIN = $scope.skins[0];
			});
		}

		$scope.removeEntry = function(index) {
			$scope.entryList.splice(index, 1);
		}

		$scope.submit = function() {
			$scope.$broadcast('show-errors-check-validity');

			if ($scope.form.$invalid) {
				createAlert('warning', 'There are errors on the form', true);
				return;
			}

			// todo: figure out why this blows on mods
/*
			if (typeof $scope.tyres.length === 'undefined' || !$scope.tyres.length){
				data.LEGAL_TYRES = $scope.selectedTyres.length === $scope.tyres.length ? '' : $scope.selectedTyres.join(';');
			}
*/
			for(var i=1; i <= $scope.amount; i++) {
				var entry = angular.copy($scope.newEntry);
				if ($scope.random) {
					entry.SKIN = $scope.skins[Math.floor(Math.random() * $scope.skins.length)];
				}
				$scope.entryList.push(entry);
			}

			$scope.newEntry = {
				DRIVERNAME: '',
				TEAM: '',
				MODEL: $scope.cars[0],
				SKIN: '',
				GUID: '',
				SPECTATOR_MODE: '',
				BALLAST: 0
			};
			$scope.selectedCarChanged();
		}

		$scope.saveChanges = function() {
			var data = {};
			angular.forEach($scope.entryList, function(value) {
				value.SPECTATOR_MODE = value.SPECTATOR_MODE ? 1 : 0;
				data['CAR_' + $scope.entryList.indexOf(value)] = value;
			});


			var cars = {};
			cars.CARS = $scope.selectedCars.join(';');
			ServerService.SaveServerDetails(cars, function(result) {
				if (!(result[0] === 'O' && result[1] === 'K')) {
					saved = false;
				}
			});

			EntryListService.SaveEntryList(data, function(result) {
				if (result[0] === 'O' && result[1] === 'K') {
					createAlert('success', 'Saved successfully', true);
				} else {
					createAlert('warning', 'Save failed', true);
				}
			});
		}

		$scope.clear = function() {
			if (confirm('Are you sure?')) {
				$scope.entryList = [];
			}
		}

		$scope.addDriver = function () {
			$scope.$broadcast('show-errors-check-validity');

			if ($scope.createForm.$invalid) {
				createAlert('warning', 'There are errors on the form', true);
				return;
			}

			DriverService.SaveDriver($scope.newDriver, function(result) {
				if (result[0] === 'O' && result[1] === 'K') {
					$scope.drivers.push($scope.newDriver);
					$scope.newDriver = {};
				} else {
					createAlert('warning', 'Save failed', true);
				}
			});
		}

		$scope.deleteDriver = function(guid) {
			if (!confirm('Are you sure you want to delete this driver?')) return;

			DriverService.DeleteDriver(guid, function(result) {
				if (result[0] === 'O' && result[1] === 'K') {
					var found = $filter('filter')($scope.drivers, { GUID: guid }, true);
					if (found.length) {
						angular.forEach(found, function(value, key) {
							$scope.drivers.splice(key, 1);
						});
					}
				} else {
					createAlert('warning', 'Delete failed', true);
				}
			});
		}

		$scope.selectDriver = function(driver) {
			$scope.newEntry.DRIVERNAME = driver.NAME;
			$scope.newEntry.TEAM = driver.TEAM;
			$scope.newEntry.GUID = driver.GUID;
		}

		function createAlert(type, msg, autoClose) {
			var alert = { type: type, msg: msg};
			$state.current.data.alerts.push(alert);
			if (autoClose) {
				$timeout(function(){
					$state.current.data.alerts.splice($state.current.data.alerts.indexOf(alert), 1);
				}, 3000);
			}
		}
	})


;

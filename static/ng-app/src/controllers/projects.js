angular.module('wsReports').controller('projectsCtrl', ['$scope', 'projects', function ($scope, projects) {

    $scope.load = function () {
        $scope.loadingProjects = true;
        $scope.projectsHttpLoading = true;
        $scope.projects = projects.query();
        $scope.projects.$promise.then(function () {
            $scope.loadingProjects = false;
        });
        $scope.projects.$httpPromise.then(function () {
            $scope.loadingProjects = false;
            $scope.projectsHttpLoading = false;
        });
    };

    $scope.refresh = function () {
        projects.$clearCache();
        $scope.load();
    };

    $scope.load();
}]);

import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import { Role, ServicePrincipal, ManagedPolicy } from '@aws-cdk/aws-iam';


export class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);




    //APPSYNC's API gives you a graphqlApi with apiKey ( for deploying APPSYNC )
    const api = new appsync.GraphqlApi(this, 'graphlApi', {
      name: 'dinningbyfriends-api',
      schema: appsync.Schema.fromAsset('graphql/schema.gql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY
        }
      }
    });




    //creating VirtualPrivateCloud
    const vpc = new ec2.Vpc(this, 'dinningbyfriends-vpc');




//********************AURORA DATABASE**********************/
    const databaseName = "dinningbyfriends_ServerlessDB";


    //creating database ( serverless cluster )
    const serverlessDB = new rds.ServerlessCluster(this, 'ServerlessDB', {
      vpc: vpc,                                               //assigning vpc for security of database
      engine: rds.DatabaseClusterEngine.aurora({              //using MySQL engine for Aurora Severless
        version: rds.AuroraEngineVersion.VER_1_22_2
      }),
      scaling: {                                              //defining scaling for pricing manage by database usage
        autoPause: cdk.Duration.minutes(10),                  //default is to pause after 5 minutes of idle time
        minCapacity: rds.AuroraCapacityUnit.ACU_2,            //default is 2 Aurora capacity units (ACUs)
        maxCapacity: rds.AuroraCapacityUnit.ACU_4             //default is 16 Aurora capacity units (ACUs)
      },
      deletionProtection: false,                              //default is true so database cluster cannot be deleted
      defaultDatabaseName: databaseName,                      //name of a database
      enableDataApi: true                                     //enabling data api
      //either use "enable-data-api" in cluster construct or this to grant access to lambda function
    });


    //create a specific role for lambdafunction
    const role = new Role(this, 'dinningbyfriends-lambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),      
      managedPolicies: [
        //giving RDS access to lambda
        ManagedPolicy.fromAwsManagedPolicyName("AmazonRDSDataFullAccess"),
        //giving VPC access to lambda
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
        //giving basic access to lambda
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ]
    });


    //getting secret from secret manager ( incase of not own password set )
    const secarn = serverlessDB.secret?.secretArn || '';
//********************AURORA DATABASE**********************/




    //creating lambdalayer
    const lambdaLayer = new lambda.LayerVersion(this, 'lambdaLayer', {
      code: lambda.Code.fromAsset('lambda-layers'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
    });
    //creating lambdafunction
    const userLambda = new lambda.Function(this, 'dinningbyfriends-userLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode("lambda/User"),
      handler: 'index.handler',
      //giving layers
      layers: [lambdaLayer],
      //giving VPC
      vpc: vpc,
      //giving role
      role: role
    });
    const restaurantLambda = new lambda.Function(this, 'dinningbyfriends-restaurantLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode("lambda/Restaurant"),
      handler: 'index.handler',
      //giving layers
      layers: [lambdaLayer],
      //giving VPC
      vpc: vpc,
      //giving role
      role: role
    });




    //setting lambdafunction ( as a datasource of endpoint )
    const userLambda_datasource = api.addLambdaDataSource('userLamdaDataSource', userLambda);
    const restaurantLambda_datasource = api.addLambdaDataSource('restaurantLamdaDataSource', restaurantLambda);



    
    //describing resolver for datasource
    userLambda_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "createUser"
    });
    userLambda_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "deleteUser"
    });
    userLambda_datasource.createResolver({
      typeName: "Query",
      fieldName: "allUsers"
    });
    //describing resolver for datasource
    restaurantLambda_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "createRestaurant"
    });
    restaurantLambda_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "deleteRestaurant"
    });
    restaurantLambda_datasource.createResolver({
      typeName: "Query",
      fieldName: "allRestaurants"
    });
    



    //adding env to lambdafunction
    userLambda.addEnvironment('CLUSTER_ARN', serverlessDB.clusterArn);
    userLambda.addEnvironment('SECRET_ARN', secarn);
    userLambda.addEnvironment('DATABASE_NAME', databaseName);
    //adding env to lambdafunction
    restaurantLambda.addEnvironment('CLUSTER_ARN', serverlessDB.clusterArn);
    restaurantLambda.addEnvironment('SECRET_ARN', secarn);
    restaurantLambda.addEnvironment('DATABASE_NAME', databaseName);


    

    //for give access to lambdafunction ( to get access data from auroraServerlessDB )
    serverlessDB.grantDataApiAccess(userLambda);
    serverlessDB.grantDataApiAccess(restaurantLambda);


    

    //create lambda once after database is created ( because lambda based on database )
    userLambda.node.addDependency(serverlessDB);
    restaurantLambda.node.addDependency(serverlessDB);




    //to control who can access the cluster or instance, use the .connections attribute. ( RDS databases have a default port: 3306 )
    serverlessDB.connections.allowFromAnyIpv4(ec2.Port.tcp(3306));
  }
}
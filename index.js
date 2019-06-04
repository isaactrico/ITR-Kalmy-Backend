const express = require('express')

// creating an express instance
const app = express()

const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const passport = require('passport')

// getting the local authentication type
const LocalStrategy = require('passport-local').Strategy


const publicRoot = 'C:\\Users\\tfoll\\Documents\\kalmy\\dist';


//////////////////////////////// -- DB configuration

const Sequelize = require('sequelize')

const sequelize = new Sequelize('db_name', 'user_name', 'password', {
  host: 'localhost',
  dialect: 'mysql',
})

sequelize.authenticate()
  .then(() => {
    console.log('DB Connected')
  })
  .catch(err => {
    console.log('Something is wrong with DB')
  })


  const Car = sequelize.define('car', {
    car_id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
    model:{ type: Sequelize.STRING},
    available: {type: Sequelize.BOOLEAN},
    brand_brand_id: {type: Sequelize.INTEGER},
    type_type_id: {type: Sequelize.INTEGER},

  }, {
    freezeTableName: true,
    timestamps: false
  })

  const Type = sequelize.define('type', {
    type_id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
    name: Sequelize.STRING,
  }, {
    freezeTableName: true,
    timestamps: false
  })

  const Brand = sequelize.define('brand', {
    brand_id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
    name: Sequelize.STRING,
  }, {
    freezeTableName: true,
    timestamps: false
  })

  const User = sequelize.define('user', {
    username_id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    create_time: Sequelize.DATE,
  }, {
    freezeTableName: true,
    timestamps: false
  })

///////////////////////////////


app.use(express.static(publicRoot))

app.use(bodyParser.json())
app.use(cookieSession({
    name: 'mysession',
    keys: ['vueauthrandomkey'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }))

app.use(passport.initialize());
app.use(passport.session());

let users = [
    {
        id: 1,
        name: "Judee",
        email: "user@email.com",
        password: "password"
    },
    {
        id: 2,
        name: "Emma",
        email: "emma@email.com",
        password: "password2"
    },
]

app.get("/", (req, res, next) => {
  res.sendFile("index.html", { root: publicRoot })
})

app.post("/api/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(400).send([user, "Bad Request", info])
        }

        req.login(user, (err) => {
            res.send("Logged in")
        })
    })(req, res, next)
})

app.post("/api/catalog", (req, res, next) => {


  var type = ""
  var model = ""
  var brand = ""

  if((req.body.type).length > 0)
    type = " AND car.type_type_id = " + req.body.type;
  if((req.body.model).length > 0)
    model = " AND car.model = '" + req.body.model + "'";
  if((req.body.brand).length > 0)
    brand = " AND brand.name = '" + req.body.brand + "'";

  var catalog = [];
  var cars = sequelize.query(`SELECT car.model, car.car_id, type.name as type, brand.name as brand FROM car, type, brand WHERE car.type_type_id = type.type_id AND car.brand_brand_id = brand.brand_id AND car.available = 1 ${type} ${model} ${brand} `).then(cars => {

    for(car in cars[0]){
      catalog[car] = {
        type: cars[0][car].type,
        brand: cars[0][car].brand,
        model: cars[0][car].model,
        carId: cars[0][car].car_id,
      }
    }

    console.log(catalog);
    res.send({catalog})
  }).catch(error =>{
    console.log(error);
  })
});



app.post("/api/rent", (req, res, next) => {

  var rentedCar;
  if(req.body.carId){
    req.body.carId
    Car.findOne({atributes: ['model'], where: { car_id: req.body.carId, available: 1 } }).then(car => {

      if(!car){
        console.log("Non succesfull operation");
        res.send({rentedCar: "Non succesfull operation"})
      }else{
        car.update({
          available: 0
        })
        console.log("succesfull operation");
        res.send({rentedCar: true});
      }
    })
  }else{

    console.log("Non succesfull operation");
    res.send({rentedCar:"Invalid Car ID"})
  }

});

app.post("/api/turn", (req, res, next) => {

  var rentedCar;
  if(req.body.carId){
    req.body.carId
    Car.findOne({atributes: ['model'], where: { car_id: req.body.carId, available: 0 } }).then(car => {

      if(!car){
        console.log("Non succesfull operation");
        res.send({turnedCar: "Non succesfull operation"})
      }else{
        car.update({
          available: 1
        })
        console.log("succesfull operation");
        res.send({turnedCar: true});
      }
    })
  }else{

    console.log("Non succesfull operation");
    res.send({turnedCar: "Invalid Car ID"})
  }

});



app.get('/api/logout', function(req, res){
    req.logout();
    console.log("logged out")
    return res.send();
});


const authMiddleware = (req, res, next) => {
    if (!req.isAuthenticated()) {
        res.status(401).send('You are not authenticated')
    } else {
        return next()
    }
};

app.get("/api/catalog", authMiddleware, (req, res) => {
  let user = users.find((user) => {
    return user.id === req.session.passport.user
  })
  console.log([user, req.session])
  res.send({user: user})

})

app.get("/api/turn", authMiddleware, (req, res) => {
  let user = users.find((user) => {
    return user.id === req.session.passport.user
  })
  console.log([user, req.session])
  res.send({user: user})

})

app.get("/api/rent", authMiddleware, (req, res) => {
  let user = users.find((user) => {
    return user.id === req.session.passport.user
  })
  console.log([user, req.session])
  res.send({user: user})

})

app.get("/api/user", authMiddleware, (req, res) => {
    let user = users.find((user) => {
        return user.id === req.session.passport.user
    })
    console.log([user, req.session])
    res.send({user: user})

})

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  (username, password, done) => {
      let user = users.find((user) => {
          return user.email === username && user.password === password
      })

      if (user) {
          done(null, user)
      } else {
          done(null, false, {message: 'Incorrect username or password'})
      }
  }
))

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  let user = users.find((user) => {
      return user.id === id
  })

  done(null, user)
})

app.listen(3000, () => {
  console.log("Example app listening on port 3000")
})

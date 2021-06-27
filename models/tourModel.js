const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Name is too long <= 40 characters'],
      minlength: [10, 'Name is too short >= 10 characters'],
      /* validate: [
        validator.isAlpha,
        'Tour name must only contain letters',
      ], */
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round((val + Number.EPSILON) * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price; // 100 < 200 = true
        },
        message: 'Discount price { {VALUE} } greater than regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty not defined',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date], //Array de fechas
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON Embbebed object
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //{longitude,latitude}
      address: String,
      description: String,
    },
    locations: [
      //Array of locations
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        day: Number,
        description: String,
      },
    ],
    guides: [
      {
        //Referenced guides ID
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Scan only docs with this index
//tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//virtuals no se guardan en DB
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; //arrow functions no tienen el retorno this
});

//Virtual populate tour with reviews (parent reference)
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//Document middleware ejecuta antes del evento (solo en save() y create())
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

/* //Get guides from ID passed in Create tour (embedding)
tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(
    async (id) => await User.findById(id)
  );
  this.guides = await Promise.all(guidesPromises);
  next();
}); */

/* tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
}); */

//Query middleware ... this->current query
//regex for strings that begin with find
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

//Populates only on the find query, not saved in DB
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} miliseconds`);
  next();
});

//Agregation middleware
tourSchema.pre('aggregate', function (next) {
  // unshift agrega match al principio del pipeline
  if (!Object.keys(this.pipeline()[0])[0] === '$geoNear')
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

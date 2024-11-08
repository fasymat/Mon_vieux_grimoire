const Book = require("../models/book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  console.log("Uploaded file:", req.file);
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Livre enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Livre modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.rateBook = async (req, res, next) => {
  try {
    const rate = req.body.rating;
    const userId = req.body.userId;
    const book = await Book.findById(req.params.id);
    const userRated = book.ratings.find((rate) => rate.UserId === userId);
    if (userRated) {
      return res
        .status(400)
        .json({ message: "Vous avez deja noté ce livre !" });
    }
    book.ratings.push({ userId, grade: rate, bookId: book._id });
    const totalRate = book.ratings.length;
    const sumRate = book.ratings.reduce((acc, rate) => acc + rate.grade, 0);
    book.averageRating = (sumRate / totalRate).toFixed(2);
    await book.save();
    res.status(200).json({
      message: "Livre noté !",
      averageRating: book.averageRating,
    });
  } catch (error) {
    res.status(400).json({ message: "erreur lors de la notation" });
  }
};

exports.getBestRatedBook = async (req, res, next) => {
  try {
    const books = await Book.find();
    const bestRatedBooks = books
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 3);
    res.status(200).json(bestRatedBooks);
  } catch (error) {
    res
      .status(400)
      .json({ message: "erreur lors de la recuparation des livres" });
  }
};

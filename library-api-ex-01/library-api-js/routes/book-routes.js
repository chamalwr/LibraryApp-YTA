import { Router } from 'express';
import { AuthorModel } from '../model/author-schema.js';
import { BookModel } from '../model/book-schema.js'
var router = Router();

router.get('/books', async function(req, res) {
    const page = Number(req.query.page);
    const take = Number(req.query.take);
    const totalBooks = await BookModel.count();

    const books = await BookModel.find()
                    .limit(take * 1)
                    .skip((page - 1) * take)
                    .populate('author')
                    .exec()
                    .catch((error) => {
                        console.log(`Error while getting all book data with Error Message ${error.message}`);
                        return res.status(500).json({ status : 500, error: `${error.message }`});
                    });
    if(books){
        return res.status(200).json({books, totalPages: Math.ceil(totalBooks / take), currentPage: page });
    }
    return res.status(200).json({books, totalPages: 0, currentPage: page });
});

router.get('/book/:id', async function(req, res) {
    const bookId = req.params.id;
    const book = await BookModel.findById(bookId).populate('author').catch((error) => {
        console.log(`Error occured while getting Book using author id ${bookId}. Error message: ${error.message}`);
        return res.status(500).json({ status: 500, error: `${error.message}` });
    });
    if(book){
        return res.status(200).json(book)
    }
    return res.status(404).json({status: 404, error: `Book not found on id ${bookId}`});
});

router.post('/book', async function(req, res) {
    const bookPayload = req.body;
    const authorId = req.body.author;

    const isAuthorExists = await AuthorModel.exists({ _id : authorId }).catch((error) => {
        console.log(`Unable to create new Book since failed to retrive author data for author ID ${authorId}
        with Error Message ${error.message}`);
        return res.status(500).json({ status: 500, error: `${error.message}` });
    });

    if(isAuthorExists){
        const savedBook = await BookModel.create(bookPayload)
            .catch((error) => {
                console.log(`Error while creating a new book with payload ${JSON.stringify(bookPayload)}. Error Message ${error.message}`);
                return res.status(500).json({ status: 500, error: `${error.message}` });
        });
        return res.status(201).json(savedBook);
    }

    return res.status(404).json({ status: 404, error: `Failed to create a new book since the selected author
                                does not exists`});

});

router.put('/book/:id', async function(req, res) {
    const bookId = req.params.id;
    const bookPayload = req.body;

    const isBookExists = await BookModel.exists({ _id : bookId })
    .catch((error) => {
        console.log(`Failed to update selected book on id ${bookId} failed to retrive book data
        Error Message ${error.message}`);
        return res.status(500).json({ status : 500, error : error.message });
    });

    if(isBookExists){
        const isAuthorExists = await AuthorModel.exists({ _id : bookPayload.author })
        .catch((error) => {
            console.log(`Failed to update selected book on id ${bookId} because fetching
            author data for the given author Id cased an error. Error Message ${error.message}`);
            return res.status(500).json({ status : 500, error : error.message });
        });    
        if(isAuthorExists){
            const updatedBookDetail = await BookModel.findByIdAndUpdate(bookId, bookPayload, { new: true }).populate('author')
            .catch((error) => {
                console.log(`Failed to update book details for Book ID ${bookId} with payload ${JSON.stringify(bookPayload)}
                            returned Error Message ${error.message}`);
                return res.status(500).json({ status : 500, error : `${error.message}` });
            });
            return res.status(200).json(updatedBookDetail);
        }
        return res.status(404).json({status: 404, error: `Author not found on id ${bookPayload.author}`});
    }
    return res.status(404).json({status: 404, error: `Book not found on id ${bookId}`});
    
});

export { router as BookRoutes }

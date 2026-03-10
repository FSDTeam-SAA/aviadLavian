import { ArticleModel } from "./article.model";
import { IArticle, IGetAllArticlesParams } from "./article.interface";
import CustomError from "../../helpers/CustomError";
import { deleteCloudinary, uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";

const createArticle = async (
    data: IArticle,
    files?: { image?: Express.Multer.File[]; video?: Express.Multer.File[] }
) => {
    const article = await ArticleModel.create(data);
    if (!article) throw new CustomError(400, "Article not created");

    // Upload Image if provided
    if (files?.image?.[0]?.path) {
        const uploaded = await uploadCloudinary(files.image[0].path);
        if (uploaded) {
            article.image = uploaded;
        }
    }

    // Upload Video if provided
    if (files?.video?.[0]?.path) {
        const uploaded = await uploadCloudinary(files.video[0].path);
        if (uploaded) {
            article.video = uploaded;
        }
    }

    if (article.isModified("image") || article.isModified("video")) {
        await article.save();
    }

    return article;
};

const getSingleArticle = async (id: string) => {
    const article = await ArticleModel.findById(id).populate('topicIds'); // Now topicIds references Injury
    if (!article) throw new CustomError(404, "Article not found");
    return article;
};

const getAllArticles = async (params: IGetAllArticlesParams) => {
    const { page, limit, sort = "decending", topicId, name } = params;
    const { limit: pageLimit, skip, page: currentPage } = paginationHelper(page, limit);

    const query: any = {};
    if (topicId) {
        // Match against both ObjectId and string representations
        const { Types } = require("mongoose");
        if (Types.ObjectId.isValid(topicId)) {
            query.topicIds = { $in: [new Types.ObjectId(topicId), topicId] };
        } else {
            query.topicIds = topicId;
        }
    }
    if (name) {
        query.name = { $regex: name, $options: "i" };
    }

    const sortObj: any = sort === "accending" ? { createdAt: 1 } : { createdAt: -1 };

    const [articles, total] = await Promise.all([
            ArticleModel.find(query)
                .populate('topicIds') // Now topicIds references Injury
                .sort(sortObj)
                .skip(skip)
                .limit(pageLimit),
        ArticleModel.countDocuments(query),
    ]);

    const meta = {
        page: currentPage,
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit),
    };

    return { articles, meta };
};

const updateArticle = async (
    id: string,
    data: Partial<IArticle>,
    files?: { image?: Express.Multer.File[]; video?: Express.Multer.File[] }
) => {
    const article = await ArticleModel.findById(id);
    if (!article) throw new CustomError(404, "Article not found");

    // Update normal fields
    Object.assign(article, data);

    // Upload Image if provided
    if (files?.image?.[0]?.path) {
        if (article.image?.public_id) {
            await deleteCloudinary(article.image.public_id);
        }
        const uploaded = await uploadCloudinary(files.image[0].path);
        if (uploaded) {
            article.image = uploaded;
        }
    }

    // Upload Video if provided
    if (files?.video?.[0]?.path) {
        if (article.video?.public_id) {
            await deleteCloudinary(article.video.public_id);
        }
        const uploaded = await uploadCloudinary(files.video[0].path);
        if (uploaded) {
            article.video = uploaded;
        }
    }

    await article.save();
    return article;
};

const deleteArticle = async (id: string) => {
    const article = await ArticleModel.findByIdAndDelete(id);
    if (!article) throw new CustomError(404, "Article not found");

    // Delete files from Cloudinary
    if (article.image?.public_id) {
        await deleteCloudinary(article.image.public_id);
    }
    if (article.video?.public_id) {
        await deleteCloudinary(article.video.public_id);
    }

    return article;
};

export const articleService = {
    createArticle,
    getSingleArticle,
    getAllArticles,
    updateArticle,
    deleteArticle,
};
